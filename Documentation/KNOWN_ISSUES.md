# Known issues

Bugs found but not fixed yet, and deprecations to migrate. Remove an entry once it is fixed.

---

## Bugs

- **Score above the max on a chart with holds**
  `GameRound.CalculateScore()` shares the score between the taps and the hold beats, but a hold head judged `Perfect` / `Great` / `Good` also adds `scorePerArrow`. A perfect game on a chart with holds ends above `CONFIG.SCORE.MAX`.
  Possible fix: count the hold heads in the taps, or score them as hold beats only.
  Test: `it.fails` in `tests/simulation/game.simulation.spec.ts`.

- **Genre autocomplete: suggestions unreachable with the keyboard**
  `OnBlur` clears the suggestion list when the input loses focus, so pressing Tab to reach a suggestion closes the list first.
  Possible fix: arrow up/down + Enter navigation from the input, with `aria-activedescendant`.

- **Gamepad player whose gamepad is not connected: the pad never responds**
  `UserConfigService` sets `gamepad.index` to `null` when the saved gamepad is not found, and `gamepad` itself is typed `| undefined`. `GameRound` and `BrowsePage` still build a `DancePadGamepad` with `player.gamepad!.index!`: it polls `getGamepads()[null]` and silently ignores every input.
  Possible fix: one shared factory for the dance pad (keyboard when `index === -1`), and a fallback to the keyboard with a warning toast when the gamepad is missing.

- **Two players: the precision and combo texts of player 2 are shown on player 1**
  `PlayerDisplayComponent` reads its texts with `document.getElementById('precision-text-*')!` and `'combo-text'`. With two displays, the ids are duplicated and both components get the first one's elements.
  Possible fix: `@ViewChild` / `@ViewChildren` template references in the component.

- **Upload: exporting an edited music writes `#DIFFICULTYCRITERIAS:[object Object]`**
  `MusicDto.DeepClone()` (used by `OnStartEdit`) goes through `NoteDataDto.FromJSON()`, which rebuilds neither `difficultyCriterias` (left a plain object, without `toString()`) nor `creationDate` (left a string, although typed `Date`). `SccWriter.WriteSscFile()` then writes `[object Object]`.
  Possible fix: rebuild both in `NoteDataDto.FromJSON()`.
  Test: `it.fails` in `tests/unit/pages/upload/reader.ssc.spec.ts` and `tests/unit/game/game-model/music.dto.spec.ts`.

- **Difficulty evaluation: `NaN` meter in two cases**
  `SccReader.ParseFile()` replaces the meter of a chart without criterias by `NoteEvaluator.GetLevelFromCriterias()`, which is `NaN` when:
  - the chart ends before the last BPM change: `EvaluateSpeed()` counts a negative duration after it, and `Math.pow` of a negative ratio is `NaN`;
  - no empty row separates two steps in the whole chart: `EvaluateBurst()` divides by a mean gap of 0.
  Test: `it.fails` in `tests/unit/pages/upload/DifficultyCriteria.spec.ts`.

- **`.sm` files: the chart credit is lost**
  `SccReader.TokenizeSM()` stores it under `credits`, `NoteDataDto` reads `credit`.
  Test: `it.fails` in `tests/unit/pages/upload/reader.ssc.spec.ts`.

- **Music cache: the localStorage quota (about 5 MB) may be reached**
  `MusicCacheService` stores every music with its charts in localStorage (`MUSIC_<id>`). A chart weighs roughly 10 to 20 KB as JSON (more with 192-row measures): with about 280 charts, the cache is already near the quota, which is not measured yet. Nothing handles `QuotaExceededError`: once it is reached, `setItem` throws in the middle of a sync and the cache is left half written. The whole cache is also read and parsed synchronously at startup.
  Possible fix: store the musics in IndexedDB (e.g. `idb-keyval`), only `PersistMusic()`, `RemoveMusic()`, `SaveRegistry()` and the startup read change. First measure the cache size (`JSON.stringify(localStorage).length` in the console).
  Test: `tests/unit/services/local-storage/music.cache.service.spec.ts` covers the cache behavior, to keep through the migration.

- **`SccReader.ParseFile()`: charts not sorted by their final meter**
  `MusicDto` sorts the charts by the meter of the file, then `ParseFile()` replaces the meters of the charts without criterias by their evaluated level, without sorting again.

## Maintenance

- **`npm audit`**: 6 vulnerabilities (5 high, 1 moderate), accepted for now. Do not run `npm audit fix --force`: it downgrades `firebase` to 9.14.0 and `@angular/build` to 22.1.9.
  - `@grpc/grpc-js` 1.9.16, pulled by `@firebase/firestore` (`~1.9.0`): only used by the Node build of Firestore, the browser build uses WebChannel. Not in the bundle. Wait for a Firebase update.
  - `vite` 8.3.0, pinned by `@angular/build` 22.2.3: only used by `ng serve` (`ng build` uses esbuild). Dev only. Wait for `@angular/build` 22.2.4.

## Improvements

Nothing for now.
