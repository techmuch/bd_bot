#!/bin/bash
set -e

# Default to ./joshua if not provided
BINARY=${1:-"./joshua"}

echo "Syncing requirements..."
$BINARY req export --out requirements.md

echo "Checking for selected tasks..."
TASKS=$($BINARY task list --selected --json)

if [ "$TASKS" = "[]" ] || [ "$TASKS" = "null" ] || [ -z "$TASKS" ]; then
    echo "No tasks selected for development."
    exit 0
fi

echo "Starting AI Development Session..."

# Construct prompt
# Note: We use a heredoc for the prompt content to handle newlines cleanly
read -r -d '' PROMPT_TEXT << EOM
You are an expert AI developer. Your goal is to implement the following selected tasks for the JOSHUA project.

### CONTEXT: REQUIREMENTS ###
$(cat requirements.md)

### CONTEXT: SELECTED TASKS ###
$TASKS

### INSTRUCTIONS ###
1. Implement the selected tasks in the codebase.
2. Review and update 'requirements.md', 'development.md', and 'README.md' to reflect your changes.
   - IMPORTANT: Mark completed tasks as checked [x] in 'requirements.md'.
3. Perform a git commit with a descriptive message and push to origin main.
   - Example: 'git add . && git commit -m "feat: implement x" && git push origin main'
4. Do not output any preamble, just perform the actions using tool calls.
EOM

# Run Gemini
echo "$PROMPT_TEXT" | gemini -y -r latest

echo "AI session complete."
echo "Syncing updates back to system..."
$BINARY req import --file requirements.md
$BINARY task sync
