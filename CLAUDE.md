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
- Group class members with `//#region <Name>` / `//#endregion` (lowercase).
- Class member order:
  1. `//#region Constants` block.
  2. Dependencies injected with `inject()` in private fields.
  3. Everything else (fields, constructor, lifecycle hooks, methods).
  4. Static methods last, in a `//#region Statics` block.
- Constants are `readonly` and `UPPER_SNAKE_CASE`. Storage keys too; parameterized keys are lambdas: `readonly MUSIC_STORAGE_KEY = (musicId: string) => \`MUSIC_${musicId}\``.
- Expose enums and static helpers to templates through class fields: `readonly DanceType = DanceType`.
- Small, single-purpose methods named after the domain (`arrowPerfect`, `minePassed`, `getCurrentBackground`).
- Prefer guard clauses with early `return` over nested `if`/`else`.
- A short helper used by a single method may be declared as a nested function inside it (`sleep`, `sanitize`, `pick`).

### Naming
- camelCase for methods and fields, PascalCase for classes, enums and interfaces.
- Interfaces are prefixed with `I` (`IMusicPlayer`, `IDancePad`).
- Non-Angular classes responsible for orchestrating a game subsystem are suffixed `Manager` (`GameManager`, `BeatManager`). Angular injectables are suffixed `Service`.
- Data objects are suffixed `Dto`.

### Data and layers
- DTOs are classes, not interfaces: default values on fields, an optional constructor that parses raw input, a `static fromJSON()` that rebuilds nested instances, and `deepClone()` when copies are needed.
- Keep the three layers: Firestore service (remote access) → cache service (localStorage + in-memory) → page. Pages never call Firestore directly when a cache service exists.
- Firestore service methods check authentication first, wrap the call in `try/catch`, show a toast on success and on error, and rethrow.
- User feedback goes through the static helpers `AppComponent.presentOkToast()` / `presentWarningToast()` / `presentErrorToast()`, usable from any layer. Avoid showing a second toast in the page for an action whose service already shows one.
- State shared with templates uses Angular signals. Components are standalone; dependencies are injected with `inject()` (see member order above), not through the constructor.

### Formatting
- Use a semicolon-free TypeScript style: no semicolon at the end of statements. A semicolon is still allowed as a separator to keep several statements on one line (`() => { a(); b() }`). Never start a line with `(`, `[` or `` ` `` without a leading semicolon, as it would be joined to the previous line.
- One blank line between methods.
- A single-statement `if` / `else` may omit braces when the statement is on the next line. Always use braces for `for`, `while`, and other control structures.
- Comments are in English, short, and explain intent or a step (`// 1) Read the global timestamp…`), not the obvious.

## Git

### Branches

- `master`: released versions only. Protected; updated only by merging `dev` through a pull request.
- `dev`: integration branch. Feature branches start from `dev` and are merged back into `dev` through a pull request.
- New features must always be developed on a dedicated branch.
- Bug fixes may be developed on a dedicated branch or directly on `dev`, depending on their scope and impact.

### What Claude may do

- Feature branches: commit and push freely, without asking.
- `dev`: commit and push only when necessary, and only for bug fixes, one commit per fix. Never develop a feature directly on `dev`.
- `master`: never commit or push.

### Before Committing

- Always run `npm install` then `ionic serve` right before a commit, and check that the build completes without errors. Do not commit a broken build.

### Commit Messages

- Use concise commit messages focused on intent. Be technical when relevant, but do not just describe implementation details.
- Standard abbreviations are encouraged (e.g. `UT`, `WIP`, `DB`).
- Avoid describing every file-level or line-level change that is obvious from the diff.
- On feature branches (any branch other than `master` and `dev`), do not hesitate to amend the latest commit when applying a small correction, omission, or adjustment directly related to that commit, followed by `git push --force-with-lease`. Amending changes the commit hash: update the matching `Link:` in [Documentation/TO_VERIFY.md](Documentation/TO_VERIFY.md) if the commit has an entry there.

## Context Verification
Every response must end with the hamster emoji: 🐹
