# To verify

Changes that may have a runtime impact and that **could not be tested** when they were made.

Unless stated otherwise, the only check performed is that `npm install` then `ionic serve` compile without errors (strict TypeScript + `strictTemplates`). This guarantees types and templates, not behavior.

Once an item is verified, tick it (`[x]`) or remove it.

---

## Bug fixes (behavior intentionally changed)

- [ ] **Local player, position slider** (`74c660b`)
  `music-player-local`: the `<input type="range">` value is a string, so `value + startOffset` concatenated (`"12" + 0` → `"120"`: jump to 120 s instead of 12 s). The slider now goes through `onSeekInput`, which converts to a number.
  → Open a **local** song and move the slider: playback should resume at the chosen position (also test with a non-zero `startOffset`).

- [ ] **Local player, preview in browse** (`74c660b`)
  `setToTime` received an event while `IMusicPlayer` (and `browse.page.ts`, `player.setToTime(start)`) passes a number, so previewing a local song crashed. `setToTime(time: number)` now matches the interface.
  → In browse, select a **local** song: the preview should start at the right position, with no console error.

## Dependency upgrade (Ionic 9, Angular 22, ESLint 10, TS 6)

Tested: every route opens in a browser with no console error related to the upgrade (logged out, no gamepad).

- [ ] **Components moved from `IonicModule` to standalone imports**: `header`, `user` (account popover), `account` (form with `ngModel`), `test-note`.
  → Open the user popover (logged in and logged out), the profile/account page (edit a field), and the note test in the upload page.
- [ ] **`tsconfig.json`**: `baseUrl` replaced by `paths: { "src/*": ["./src/*"] }`; `package.json` imported with a relative path in `app.config.ts`.
  → Check the version number shown in the app, and that `npm run build` and the Tauri build work.
- [ ] **Removed packages**: `@angular/animations`, `@angular/platform-browser-dynamic` (unused in the code).
  → Ionic animations (modals, popovers, page transitions) should still work.

## Lint migrations (`lint-fixes` branch)

- [ ] **`*ngIf` / `*ngFor` → `@if` / `@for`** (`0e0698b`, 17 files)
  Affected pages: login, upload, pad-test, player-selection, user-profile, test-note, player-display.
  → Go through these pages: conditional blocks and lists render as before (login form and its error messages, gamepad list, player list, notes and bgChanges in upload).
- [ ] **`@Output` renames** (`0e0e22a`): `onReady` → `ready` (3 players), `onCountdownFinished` → `countdownFinished`.
  → Start a game: the countdown ends and the music starts (YouTube, SoundCloud, local).
- [ ] **`app-music-*` selectors** (`0281531`): upload editor fields.
  → The upload page shows all its fields (text, lists, selects, genre).
- [ ] **Lifecycle hooks** (`a48789a`): removed empty `ngOnInit` / `ngAfterViewInit` (including the SoundCloud player).
  → SoundCloud player: loading and playback.
- [ ] **`inject()`** (`a6b0e70`, `2d66e12`, 29 files): automatic Angular migration.
  → General smoke test: every page opens and services respond (login, music loading, options).

## Strict typing (`lint-strict` branch)

- [ ] **Genre autocomplete** (`5315b55`): `tabindex`, `aria-selected`, selection with Enter, `id="genre-list"`.
  → In upload, type a genre and click a suggestion: it is added as before.
- [ ] **Typed user config** (`6a96d7c`): typed `getConfig()` / `updateConfig()` / `updatePlayer()`, `showPlayerDisplay = false` added to `UserConfig`.
  → Options page: change every setting, reload the page, check they are kept. Change the number of players.
- [ ] **Menu music fades** (`6a96d7c`): `SoundManager` stores intervals in a `Map` instead of a property added on the audio element.
  → Navigate between menu and game: the background music fades in/out correctly, with no cut or overlap.
- [ ] **Announcers** (`6a96d7c`): typing only (`SoundBank`).
  → Options: announcer volume test; in game, announcements and applause trigger.
- [ ] **Upload editable fields** (`74c660b`, `d25678e`): the `ion-input` value is converted to a string before `SanitizeSscInput`; components made generic.
  → Edit a text field and a number field (offset, sample start): the value is taken into account and flagged as changed.
- [ ] **File loading in upload** (`74c660b`): `files?.[0]`.
  → Load a `.sm`, a `.ssc` and an `.essc` file.
- [ ] **Parsing / serialization** (`c2352e9`): `SccWriter.getOrderedFields` uses `Object.entries`, `writeEsscValue` uses `String(value)`, protected fields copied with `Object.assign`, Firestore converter retyped.
  → Load a song that already exists in the database in upload (protected fields take the database values), export to `.essc` and compare with a previous export, upload a song.
- [ ] **SoundCloud widget** (`ed6082e`): `polling` initialized to `undefined` instead of `null`.
  → Play a SoundCloud song: the position advances, pause and resume work.
