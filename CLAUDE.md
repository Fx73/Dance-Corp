# CLAUDE.md

## Repository convention
The repository language is English.
Always generate repository-facing content in English, regardless of the language used in the conversation.
Always write commit messages in English.

## Tracking Untested Changes
For each commit, for every modification that may have runtime impact and that you were unable to verify yourself, add a verification entry to [Documentation/TO_VERIFY.md](Documentation/TO_VERIFY.md) using the following format:

>## Commit: <commit title>
>Link: <commit URL>
>
>- <file 1>: <summary of the change>
>- <file 2>: <summary of the change>
>- <file N>: <summary of the change>
>
>→ To verify:
>  - <verification point 1>
>  - <verification point 2>
>  - <verification point 3>

## Context Verification
Every response must end with the hamster emoji: 🐹
