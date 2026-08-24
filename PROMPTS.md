# Feature & Bug Log

This file tracks major feature additions and bug fixes, capturing the prompts that initiated them as per `AI_INSTRUCTIONS.md`.

## [2026-05-10] Supabase Authentication Integration

**Prompt:**
"Let's create the authentication feature. This will entail using a backend service -- let's use supabase. For auth, let's use a 3rd party connection to gmail account. Tasks will be saved to the authenticated user.

The next step will be to create a backend in supabase rather than use local storage. But first, let's focus on the authentication system."

## [2026-05-10] Supabase Backend Migration

**Prompt:**
"google login is enabled and configured the .env file" (Moving to next phase: Backend Migration)

## [2026-05-31] Project Enhancements (Calendar, Subtasks, Reminders)

**Prompt:**
"using enhancement.md, apply the enhancements to the project. Make sure to follow AIINSTRUCTIONS.md when applying these enhancements and make sure to mark down each feature enhancement to the ledger"

## [2026-05-31] Board Enhancements

**Prompt:**
"apply enhancements for the board"
## [2026-06-20] Backlog Feature

**Prompt:**
"Implement a backlog feature where tasks can be created but there isn't a concrete due date"

## [2026-06-21] Vector Similarity Search Feature

**Prompt:**
"let's create a search bar functionality that can look for any task, including ones in backlog and ones that have been done and are not shown in the board. Here, let's utilize vector similarity to search for tasks"
## [2026-06-22] Quick Notes Feature

**Prompt:**
"Create a feature called quick notes. This will be a tab underneath reminders. What I am envision is a text sandbox (sort of like notion or onenote) where I can just type text as notes then be able to link the relevant note to a task. Also, based on notes, I want a feature that can create a task. For example, if the note was captured as meeting minutes and it says create PRD for wallet estimations, there should be the ability to synthesize the note and create a task based off that. The synthesization could be an ai agent, where you can hover over the text and it will give you options to link to task or create new task (create new task will invoke an agent to read over the note and create a task based on the information provided)"

## [2026-08-24] Archive Quick Notes Functionality

**Prompt:**
"Let's archive the quick notes functionality"
