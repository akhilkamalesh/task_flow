import type { Task } from '../types';

export interface SearchResult {
  task: Task;
  score: number;
}

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent',
  'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its',
  'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off',
  'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than',
  'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these',
  'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats',
  'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with',
  'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves'
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0 && !STOP_WORDS.has(word));
}

export function searchTasks(tasks: Task[], query: string): SearchResult[] {
  if (!query.trim()) {
    return tasks.map(task => ({ task, score: 0 }));
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    // If query only contains stop words or is empty, fallback to simple substring match
    const lowerQuery = query.toLowerCase().trim();
    return tasks.map(task => {
      const matchTitle = task.title.toLowerCase().includes(lowerQuery);
      const matchDesc = (task.description || '').toLowerCase().includes(lowerQuery);
      return {
        task,
        score: matchTitle ? 0.8 : matchDesc ? 0.4 : 0
      };
    });
  }

  // Step 1: Tokenize all tasks and build corpus documents
  // We place higher weight on the title than description
  const docTokens: string[][] = tasks.map(task => {
    const titleTokens = tokenize(task.title);
    const descTokens = tokenize(task.description || '');
    // Duplicate title tokens to give title more weight (e.g. 3x)
    return [...titleTokens, ...titleTokens, ...titleTokens, ...descTokens];
  });

  // Step 2: Build vocabulary and compute Document Frequency (DF)
  const dfMap: Record<string, number> = {};
  docTokens.forEach(tokens => {
    const uniqueTokens = new Set(tokens);
    uniqueTokens.forEach(token => {
      dfMap[token] = (dfMap[token] || 0) + 1;
    });
  });

  const numDocs = tasks.length;

  // Step 3: Compute Inverse Document Frequency (IDF)
  const idfMap: Record<string, number> = {};
  Object.keys(dfMap).forEach(token => {
    // Standard smoothed IDF
    idfMap[token] = Math.log((1 + numDocs) / (1 + dfMap[token])) + 1;
  });

  // Step 4: Represent query as a TF-IDF vector
  const queryTf: Record<string, number> = {};
  queryTokens.forEach(token => {
    queryTf[token] = (queryTf[token] || 0) + 1;
  });

  const queryVector: Record<string, number> = {};
  let queryLength = 0;
  Object.keys(queryTf).forEach(token => {
    // If the token is not in the corpus vocabulary, its IDF defaults to standard value
    const idf = idfMap[token] || Math.log((1 + numDocs) / 1) + 1;
    const val = queryTf[token] * idf;
    queryVector[token] = val;
    queryLength += val * val;
  });
  queryLength = Math.sqrt(queryLength);

  // Step 5: Represent each task document as a TF-IDF vector and compute similarity
  const results: SearchResult[] = tasks.map((task, docIndex) => {
    const tokens = docTokens[docIndex];
    const tfMap: Record<string, number> = {};
    tokens.forEach(token => {
      tfMap[token] = (tfMap[token] || 0) + 1;
    });

    const docVector: Record<string, number> = {};
    let docLength = 0;
    Object.keys(tfMap).forEach(token => {
      const idf = idfMap[token] || 0;
      const val = tfMap[token] * idf;
      docVector[token] = val;
      docLength += val * val;
    });
    docLength = Math.sqrt(docLength);

    // Calculate Cosine Similarity (dot product / (length1 * length2))
    if (queryLength === 0 || docLength === 0) {
      // Fallback: simple text inclusion checking if cosine similarity can't be computed
      const hasTitleWord = queryTokens.some(qt => task.title.toLowerCase().includes(qt));
      return { task, score: hasTitleWord ? 0.1 : 0 };
    }

    let dotProduct = 0;
    Object.keys(queryVector).forEach(token => {
      if (docVector[token]) {
        dotProduct += queryVector[token] * docVector[token];
      }
    });

    const cosineSim = dotProduct / (queryLength * docLength);
    
    // Boost score slightly if there's an exact substring match of the query in the title
    const lowerQuery = query.toLowerCase().trim();
    let finalScore = cosineSim;
    if (task.title.toLowerCase().includes(lowerQuery)) {
      finalScore = Math.min(1.0, finalScore + 0.2);
    }

    return { task, score: finalScore };
  });

  return results;
}
