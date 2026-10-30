# CLAUDE.md

## Repository convention

The repository language is English.
Always generate repository-facing content in English, regardless of the language used in the conversation.
Always write commit messages in English.

## Found Error

If you identify a bug, error, code smell, or unexpected behavior that is not related to the current task, add an entry to [Documentation/KNOWN_ISSUES.md](Documentation/KNOWN_ISSUES.md). Do not expand the scope of the ongoing work to fix unrelated issues unless explicitly instructed to do so.

## Missing Features

If you identify a missing feature (an unsupported part of a file format, a game mechanic, some content), add an entry to [Documentation/MISSING_FEATURES.md](Documentation/MISSING_FEATURES.md):

- **High priority** if its absence blocks part of the game (some songs or charts cannot be played correctly).
- **Low priority** if it is optional content that blocks nothing.

Do not implement it unless explicitly instructed to do so.

## Tracking Untested Changes

For each commit, for every modification that may have runtime impact and that you were unable to verify yourself, add a verification entry to [Documentation/TO_VERIFY.md](Documentation/TO_VERIFY.md) using the following format:

> ## Commit: <commit title>
>
> Link: <commit URL>
>
> - <file 1>: <summary of the change>
> - <file 2>: <summary of the change>
> - <file N>: <summary of the change>
>
> → To verify:
>
> - <verification point 1>
> - <verification point 2>
> - <verification point 3>

## Coding Style

Write new code the way the existing code is written. Known deviations to avoid are listed in [Documentation/KNOWN_ISSUES.md](Documentation/KNOWN_ISSUES.md) (Improvements, Code style to harmonize).

### Structure

- Group class members with `//#region <Name>` / `//#endregion` (lowercase).
- Class member order:
  1. `//#region Constants` block.
  2. Dependencies injected with `inject()` in private fields.
  3. Everything else (fields, constructor, lifecycle hooks, methods).
  4. Static methods last, in a `//#region Statics` block.
- Constants are `readonly` and `UPPER_SNAKE_CASE`. Storage keys too; parameterized keys are lambdas: `readonly MUSIC_STORAGE_KEY = (musicId: string) => \`MUSIC\_${musicId}\``.
- Expose enums and static helpers to templates through class fields: `readonly DanceType = DanceType`.
- Small, single-purpose methods named after the domain (`ArrowPerfect`, `MinePassed`, `GetCurrentBackground`).
- Prefer guard clauses with early `return` over nested `if`/`else`.
- A short helper used by a single method may be declared as a nested function inside it (`Sleep`, `Sanitize`, `Pick`).

### Naming

- C# convention: PascalCase for methods and functions (instance, static, interface methods, nested functions), and for classes, enums and interfaces. camelCase for fields, properties, variables and parameters.
- Exceptions, kept as the framework or the external API calls them: Angular and Ionic lifecycle hooks (`ngOnInit`, `ionViewWillEnter`…), `toJSON`, `toString`, Firestore converters (`toFirestore` / `fromFirestore`), router guards (`canActivate`), and interfaces describing an external API (wrapped in an `eslint-disable` block for `@typescript-eslint/naming-convention`).
- Enforced by ESLint (`@typescript-eslint/naming-convention`).
- Interfaces are contracts implemented by classes, prefixed with `I` (`IMusicPlayer`, `ITimedChange`). A data-only shape that no class implements is a `type`, without prefix (`PrecisionMessage`).
- Non-Angular classes responsible for orchestrating a game subsystem are suffixed `Manager` (`GameManager`, `BeatManager`). Angular injectables are suffixed `Service`.
- Data objects are suffixed `Dto`.

### Data and layers

- DTOs are classes, not interfaces: default values on fields, an optional constructor that parses raw input, a `static FromJSON()` that rebuilds nested instances, and `DeepClone()` when copies are needed.
- Keep the three layers: Firestore service (remote access) → cache service (localStorage + in-memory) → page. Pages never call Firestore directly when a cache service exists.
- Firestore service methods check authentication first, and let errors propagate.
- Logging: `console.log` only for informative traces at strategic points (loading, sync, game lifecycle), with useful data. Never in per-frame or per-arrow paths: add those only temporarily to track a specific bug. In production (`environment.production`), `SilenceConsole()` mutes everything except `console.error` and `productionConsole` (used by the toasts, and for messages meant for the end user).
- Types tell the truth. A value that can be missing is typed so (`Partial<Record<…>>`, `| undefined`, `.at()` instead of `[index]`), and only then checked with `?.` or `??`.
- User feedback goes through the static helpers `AppComponent.PresentOkToast()` / `PresentWarningToast()` / `PresentErrorToast()`, shown by the page or component that triggered the action. Services throw; they only show a toast for work they start themselves (listeners, background tasks).
- State shared with templates uses Angular signals. Components are standalone; dependencies are injected with `inject()` (see member order above), not through the constructor.

### Formatting

- Use a semicolon-free TypeScript style: no semicolon at the end of statements. A semicolon is still allowed as a separator to keep several statements on one line (`() => { Stop(); Play() }`). Never start a line with `(`, `[` or `` ` `` without a leading semicolon, as it would be joined to the previous line.
- One blank line between methods.
- A single-statement `if` / `else` may omit braces when the statement is on the next line. Always use braces for `for`, `while`, and other control structures.
- Comments are in English, short, and explain intent or a step (`// 1) Read the global timestamp…`), not the obvious.

## Firebase

- Two projects: `dance-corp-dev` (`ng serve`, `tauri dev`, the `dev` build configuration, the `dev` branch and PR previews) and `dance-corp` (production, `master` only). Their config lives in `src/environments/`.
- Firestore rules and indexes are code: [website/firestore.rules](website/firestore.rules) and [website/firestore.indexes.json](website/firestore.indexes.json), deployed by the Deploy workflow. Never edit them in the Firebase console: the next deploy overwrites it.
- Rules duplicate some client checks (protected music fields): keep both sides in sync.
- Charts are stored in `musics/{id}/notes/{chartName}`, indexed by `musics/{id}.charts` (`{ [chartName]: creatorId }`). Creating or deleting a chart writes both in one batch, with `lastChartChange` naming the chart: the rules reject any other change. Only `MusicFirestoreService` knows this layout; the rest of the app uses `MusicDto.noteData`, rebuilt on read.
- [tools/copy-prod-to-dev.mjs](tools/copy-prod-to-dev.mjs) refreshes the dev catalog (`musics` with their charts, `metadata`) from prod. Never copy `users` to dev.

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
- Wiki: commit and push freely when updating it before a pull request to `dev` (see below).

### Versioning

- The version in `package.json` is bumped by the CI: patch on each push to `dev` (`deploy.yml`), minor when a `dev` → `master` PR is opened (`release.yml`), and each `master` deploy is tagged `vX.Y.Z`.
- Never change the version by hand, except for a new major: a version changed in the pushed commits is kept as is.

### Before Committing

- Always run `npm install` then `ionic serve` right before a commit, and check that the build completes without errors. Do not commit a broken build.
- Always run `ng lint` right before a commit, and fix every error. Do not commit with lint errors.
- Always run `ng test` right before a commit. Do not commit failing tests.

## Tests

- Unit tests live in `tests/unit/`, mirroring `src/app/`, never next to the code. Chart files used by the tests go in `tests/unit/fixtures/charts/`.
- Game simulation tests live in `tests/simulation/`: they play whole games with the real `GameManager` on a fake clock. Gameplay changes (timing, judgment, score) come with a simulation.
- Firestore rules tests live in `tests/firestore/` and run against the emulator with `npm run test:rules` (needs Java 21). Any change to `firestore.rules` comes with its tests.
- A bug found while writing a test is not fixed in the same work: it gets a `KNOWN_ISSUES.md` entry and an `it.fails` test, which turns red once the bug is fixed (then switch it to `it`).

### Before Opening a Pull Request to `dev`

- Check that the [wiki](https://github.com/Fx73/Dance-Corp/wiki) matches the changes of the branch (gameplay rules, chart format, architecture, setup, CI/CD), and update it if it is not done yet. Also keep the feature status of [README.md](README.md) in sync.
- The wiki is a separate repository: `https://github.com/Fx73/Dance-Corp.wiki.git`. Clone it outside the project. A push publishes it immediately, without a pull request.
- In the wiki, link to repository files with absolute URLs on `master` (`https://github.com/Fx73/Dance-Corp/blob/master/...`), and to other wiki pages with `[[Page Name]]`. `_Sidebar.md` and `_Footer.md` are shown on every page.

### Commit Messages

- Use concise commit messages focused on intent. Be technical when relevant, but do not just describe implementation details.
- Standard abbreviations are encouraged (e.g. `UT`, `WIP`, `DB`).
- Avoid describing every file-level or line-level change that is obvious from the diff.
- On feature branches (any branch other than `master` and `dev`), do not hesitate to amend the latest commit when applying a small correction, omission, or adjustment directly related to that commit, followed by `git push --force-with-lease`. Amending changes the commit hash: update the matching `Link:` in [Documentation/TO_VERIFY.md](Documentation/TO_VERIFY.md) if the commit has an entry there.

## Context Verification

Every response must end with the hamster emoji: 🐹
