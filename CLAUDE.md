# CLAUDE.md

## Repository convention
The repository language is English.
Always generate repository-facing content in English, regardless of the language used in the conversation.
Always write commit messages in English.

## Found Error

If you identify a bug, error, code smell, or unexpected behavior that is not related to the current task, add an entry to [Documentation/KNOWN_ISSUES.md](Documentation/KNOWN_ISSUES.md). Do not expand the scope of the ongoing work to fix unrelated issues unless explicitly instructed to do so.

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

## Coding Style
Write new code the way the existing code is written. Known deviations to avoid are listed in [Documentation/KNOWN_ISSUES.md](Documentation/KNOWN_ISSUES.md) (Improvements, Code style to harmonize).

### Structure
- Group class members with `//#region <Name>` / `//#endregion` (lowercase). Put constants first, in a `//#region Constants` block.
- Constants are `readonly` and `UPPER_SNAKE_CASE`. Storage keys too; parameterized keys are lambdas: `readonly MUSIC_STORAGE_KEY = (musicId: string) => \`MUSIC_${musicId}\`;`.
- Expose enums and static helpers to templates through class fields: `readonly DanceType = DanceType;`.
- Small, single-purpose methods named after the domain (`arrowPerfect`, `minePassed`, `getCurrentBackground`).
- Prefer guard clauses with early `return` over nested `if`/`else`.
- A short helper used by a single method may be declared as a nested function inside it (`sleep`, `sanitize`, `pick`).

### Naming
- camelCase for methods and fields, PascalCase for classes, enums and interfaces.
- Interfaces are prefixed with `I` (`IMusicPlayer`, `IDancePad`).
- Plain (non-Angular) logic classes that own a part of the game are suffixed `Manager` (`GameManager`, `BeatManager`). Angular injectables are suffixed `Service`.
- Data objects are suffixed `Dto`.

### Data and layers
- DTOs are classes, not interfaces: default values on fields, an optional constructor that parses raw input, a `static fromJSON()` that rebuilds nested instances, and `deepClone()` when copies are needed.
- Keep the three layers: Firestore service (remote access) → cache service (localStorage + in-memory) → page. Pages never call Firestore directly when a cache service exists.
- Firestore service methods check authentication first, wrap the call in `try/catch`, show a toast on success and on error, and rethrow.
- User feedback goes through the static helpers `AppComponent.presentOkToast()` / `presentWarningToast()` / `presentErrorToast()`, usable from any layer. Avoid showing a second toast in the page for an action whose service already shows one.
- State shared with templates uses Angular signals. Components are standalone; dependencies are injected with `inject()` in private fields at the top of the class.

### Formatting
- Always end statements with a semicolon. One blank line between methods.
- A single-statement `if` / `else` / `for` may omit braces when the statement is on the next line.
- Keep the indentation of the file being edited (4 spaces in services and game code, 2 in Angular pages and components).
- Comments are in English, short, and explain intent or a step (`// 1) Read the global timestamp…`), not the obvious.
- No `console.log` in per-frame or per-arrow code paths.

## Context Verification
Every response must end with the hamster emoji: 🐹
