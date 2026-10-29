# Known issues

Bugs found but not fixed yet, and deprecations to migrate. Remove an entry once it is fixed.

---

## Bugs

- **Genre autocomplete: suggestions unreachable with the keyboard**
  `OnBlur` clears the suggestion list when the input loses focus, so pressing Tab to reach a suggestion closes the list first.
  Possible fix: arrow up/down + Enter navigation from the input, with `aria-activedescendant`.

- **Gamepad player whose gamepad is not connected: the pad never responds**
  `UserConfigService` sets `gamepad.index` to `null` when the saved gamepad is not found, and `gamepad` itself is typed `| undefined`. `GameRound` and `BrowsePage` still build a `DancePadGamepad` with `player.gamepad!.index!`: it polls `getGamepads()[null]` and silently ignores every input.
  Possible fix: one shared factory for the dance pad (keyboard when `index === -1`), and a fallback to the keyboard with a warning toast when the gamepad is missing.

- **Two players: the precision and combo texts of player 2 are shown on player 1**
  `PlayerDisplayComponent` reads its texts with `document.getElementById('precision-text-*')!` and `'combo-text'`. With two displays, the ids are duplicated and both components get the first one's elements.
  Possible fix: `@ViewChild` / `@ViewChildren` template references in the component.

- **Hold without an end in the chart: negative hold time**
  `ArrowManager` only sets `beatEnd` when it reads the hold tail, so an unterminated hold keeps `beatEnd = null`. `GameRound.CalculateScore()` then adds `null - beatPosition` (negative) to the total hold time, and `PlayerDisplayComponent` draws the hold up to beat 0 (`beatEnd!` in both, and in `ArrowOk`).
  Possible fix: turn an unterminated hold into a tap when parsing, and type `beatEnd` as `number` for holds.

- **Music without artist, title or BPMs**
  `MusicDto` builds its id with `Sanitize(this.artist!)` / `Sanitize(this.title!)`, which throws when one is missing, and assigns `ParseChanges(bpms)!`, which leaves `bpms` `undefined` when the file has no `#BPMS`.
  Possible fix: reject the file at parsing with a clear error, or fall back to a default.

## Maintenance

- **`npm audit`**: 6 vulnerabilities (5 high, 1 moderate), accepted for now. Do not run `npm audit fix --force`: it downgrades `firebase` to 9.14.0 and `@angular/build` to 22.1.9.
  - `@grpc/grpc-js` 1.9.16, pulled by `@firebase/firestore` (`~1.9.0`): only used by the Node build of Firestore, the browser build uses WebChannel. Not in the bundle. Wait for a Firebase update.
  - `vite` 8.3.0, pinned by `@angular/build` 22.2.3: only used by `ng serve` (`ng build` uses esbuild). Dev only. Wait for `@angular/build` 22.2.4.

## Improvements

Nothing for now.

## Code style to harmonize

Nothing for now.
