export const calculateNextOccurrence = (currentDateStr: string, pattern: string): Date => {
  const date = new Date(currentDateStr);
  if (pattern === 'daily') {
    date.setDate(date.getDate() + 1);
    return date;
  }
  if (pattern.startsWith('weekly:')) {
    const targetDayName = pattern.split(':')[1];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = dayNames.indexOf(targetDayName);
    
    // Add 1 day first, then loop to find next occurrence matching that day of week
    date.setDate(date.getDate() + 1);
    while (date.getDay() !== targetDay) {
      date.setDate(date.getDate() + 1);
    }
    return date;
  }
  if (pattern.startsWith('monthly:')) {
    const targetDayNum = parseInt(pattern.split(':')[1], 10);
    
    // Increment month
    date.setMonth(date.getMonth() + 1);
    
    // Clamp the target date to max days in that month
    const lastDayOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(targetDayNum, lastDayOfNextMonth));
    return date;
  }

  // Fallbacks
  switch (pattern) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      date.setDate(date.getDate() + 1);
  }
  return date;
};

export const formatRecurrenceDate = (date: Date): string => {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

export const getBaseTitle = (title: string): string => {
  return title.replace(/\s+\d{1,2}\/\d{1,2}\/\d{4}$/, '');
};
