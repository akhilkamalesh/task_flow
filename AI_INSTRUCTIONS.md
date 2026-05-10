# AI Assistant Instruction Sheet & Best Practices

This document serves as the source of truth for best practices and rules for the AI assistant when working on this project.

## 📝 Core Rules

1. **Prompt Capturing**: Capture important prompts that create new features or update bugs. We do not need to capture prompts such as "improve this", or "change color here". Document these significant prompts in a `PROMPTS.md` file (or similar log) to maintain a history of major feature additions and bug fixes.

## 🛠 Development Best Practices

### Code Quality & Architecture
- **Modularity**: Keep components small, focused, and single-responsibility. Extract reusable logic into custom hooks or utility functions.
- **Consistency**: Always adhere to the existing codebase patterns, naming conventions, and file structure. When in doubt, match the surrounding code.
- **TypeScript First**: Utilize strict typing. Avoid `any` wherever possible. Define clear, descriptive interfaces and types for data models and component props.
- **State Management**: Keep state as localized as possible. Only elevate state to context or global stores when it needs to be shared across multiple independent components.

### UI / UX & Aesthetics
- **Premium Design**: Ensure the UI feels modern, dynamic, and responsive. Utilize smooth transitions, micro-animations, and clean typography.
- **Feedback & Interactions**: Provide immediate visual feedback for user actions (e.g., loading states, success/error toasts, hover effects).
- **Accessibility**: Use semantic HTML and ensure basic accessibility standards are met.

### Workflow
- **Plan Before Execution**: For significant architectural changes or new features, outline a clear implementation plan before modifying code.
- **Incremental Changes**: Make changes iteratively. Ensure the application remains in a working state after each logical step.
- **Verification**: Always verify changes (visually and functionally) to ensure no regressions are introduced before concluding a task.

### Communication
- **Concise Updates**: Provide clear, concise summaries of what was changed and why.
- **Clarification Over Assumption**: If requirements are ambiguous or underspecified, stop and ask for clarification rather than making assumptions.
