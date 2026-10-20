# To verify

Changes that may have a runtime impact and that could not be verified when they were made.

Unless stated otherwise, the only check performed is that `npm install` then `ionic serve` compile without errors (strict TypeScript + `strictTemplates`). This guarantees types and templates, not behavior.

Remove an entry once it is verified.

---

## Commit: Uograde et cleanup des packages
Link: https://github.com/Fx73/Dance-Corp/commit/e18180e622fee2487a0f449a4bf7e44b82c079f3

Tested: every route opens in a browser with no console error related to the upgrade (logged out, no gamepad).

- src/app/shared/component/header/header.component.ts: `IonicModule` replaced by standalone Ionic imports
- src/app/shared/user/user.component.ts: `IonicModule` replaced by standalone Ionic imports
- src/app/pages/user-profile/account/account.component.ts: `IonicModule` replaced by standalone Ionic imports (form with `ngModel`)
- src/app/pages/upload/test-note/test-note.component.ts: unused `IonicModule` import removed
- tsconfig.json: `baseUrl` replaced by `paths: { "src/*": ["./src/*"] }`
- src/app.config.ts: `package.json` imported with a relative path

→ To verify:
  - Open the user popover, logged in and logged out
  - Profile/account page: edit a field
  - Upload page: open the note test
  - The version number shown in the app is correct
  - `npm run build` and the Tauri build work

## Commit: Remove unused packages
Link: https://github.com/Fx73/Dance-Corp/commit/1eb0d9adb459dd35810b34f0fa831b303f104487

- package.json: `@angular/animations` and `@angular/platform-browser-dynamic` removed (unused in the code)

→ To verify:
  - Ionic animations still work (modals, popovers, page transitions)

## Commit: Migration *ngIf/*ngFor vers @if/@for
Link: https://github.com/Fx73/Dance-Corp/commit/0e0698b2e908e4e06f9b3cfc44b58f4ddce3deef

- src/app/shared/user/login/login.component.html: `*ngIf` → `@if`
- src/app/pages/upload/upload.page.html: `*ngIf` / `*ngFor` → `@if` / `@for`
- src/app/pages/options/pad-test/pad-test.page.html: `*ngIf` / `*ngFor` → `@if` / `@for`
- src/app/pages/player-selection/player-selection.page.html: `*ngFor` → `@for`
- src/app/pages/user-profile/user-profile.page.html: `*ngIf` → `@if`
- src/app/pages/upload/test-note/test-note.component.html: `*ngIf` → `@if`
- src/app/game/game-display/player-display.component.html: `*ngIf` → `@if`
- 10 component files: unused `CommonModule` / `NgIf` imports removed

→ To verify:
  - Login form and its validation error messages
  - Pad test: gamepad list, players and key mapping
  - Player selection: player list, user and gamepad selects
  - Upload: notes list, bgChanges list, delete button icon
  - User profile: avatar
  - In game: "Training Mode" and "Failed" labels

## Commit: Renommage des @Output préfixés par "on"
Link: https://github.com/Fx73/Dance-Corp/commit/0e0e22a90dfaff4d0774eb5c0e6cf0b48b9a2188

- src/app/game/music-player/*: `onReady` output renamed to `ready` (YouTube, SoundCloud, local players and `IMusicPlayer`)
- src/app/game/game-display/waiting-screen/waiting-screen.component.ts: `onCountdownFinished` renamed to `countdownFinished`
- game, browse and test-note templates: bindings updated

→ To verify:
  - Start a game with a YouTube, a SoundCloud and a local song: the countdown ends and the music starts
  - Browse: the song preview starts
  - Upload: the note test plays the music

## Commit: Préfixe app- pour les sélecteurs des composants d'upload
Link: https://github.com/Fx73/Dance-Corp/commit/02815315f8165b112f3856a7c66a951b8729f616

- src/app/pages/upload/*: `music-*` selectors renamed to `app-music-*` (editable field, autocomplete, list, select)

→ To verify:
  - The upload page shows all its fields (text, lists, selects, genre)

## Commit: Nettoyage des hooks de cycle de vie
Link: https://github.com/Fx73/Dance-Corp/commit/a48789a20ac17306ebec50f11f47167a0c65a2b4

- src/app/game/music-player/music-player-soundcloud/music-player-soundcloud.component.ts: empty `ngAfterViewInit` and `AfterViewInit` interface removed
- about, pad-test, player-selection, user-profile pages and waiting-screen: empty `ngOnInit` removed

→ To verify:
  - SoundCloud player: loading and playback

## Commit: Migration vers inject() : services et guard
Link: https://github.com/Fx73/Dance-Corp/commit/a6b0e70bbc0eb333b340cf732b1a55e5645237b8

- src/app/services/**, src/app/shared/guard/user.guard.ts: constructor injection replaced by `inject()` (automatic Angular migration)

→ To verify:
  - Login and logout
  - Pages protected by the guard redirect when logged out and open when logged in
  - Songs load from the cache and from Firestore

## Commit: Migration vers inject() : composants et pages
Link: https://github.com/Fx73/Dance-Corp/commit/2d66e12bd6d3600f359aeb837c43410ab8dcc163

- 20 component and page files: constructor injection replaced by `inject()` (automatic Angular migration)

→ To verify:
  - Every page opens and works as before (smoke test)

## Commit: Accessibilité de la liste d'autocomplétion des genres
Link: https://github.com/Fx73/Dance-Corp/commit/5315b558a4c67bd410bba0244f8503f45dec9a24

- src/app/pages/upload/editable-field-autocomplete/editable-field-autocomplete.component.html: suggestions get `tabindex`, `aria-selected` and selection with Enter; list gets `id="genre-list"`

→ To verify:
  - Upload: type a genre and click a suggestion, it is added as before

## Commit: Typage de la config utilisateur et des services audio (no-explicit-any)
Link: https://github.com/Fx73/Dance-Corp/commit/6a96d7cdcdb3821793901ce82fd755a93a65dc82

- src/app/services/userconfig.service.ts: typed `getConfig()` / `updateConfig()` / `updatePlayer()`, `showPlayerDisplay = false` added to `UserConfig`
- src/app/pages/options/options.page.ts: typed config accessors, raw Ionic values kept as is
- src/app/services/gameplay/sound.service.ts: fade intervals stored in a `Map` instead of a property added on the audio element
- src/app/services/gameplay/announcer.service.ts: typing only (`SoundBank`)

→ To verify:
  - Options page: change every setting, reload the page, settings are kept
  - Options page: change the number of players
  - Navigate between menu and game: the background music fades in and out, with no cut or overlap
  - Options: announcer volume test; in game, announcements and applause trigger

## Commit: Typage des paramètres d'événements (no-explicit-any)
Link: https://github.com/Fx73/Dance-Corp/commit/74c660be0eb0654e76004b5736545f19903b0cb6

- src/app/game/music-player/music-player-local/music-player-local.component.ts: **bug fix**, the slider value is a string, so `value + startOffset` concatenated (`"12" + 0` → `"120"`). The slider now goes through `onSeekInput`, which converts to a number
- src/app/game/music-player/music-player-local/music-player-local.component.ts: **bug fix**, `setToTime(time: number)` now matches `IMusicPlayer`; it previously expected an event, so `player.setToTime(start)` from browse crashed for local songs
- src/app/pages/upload/editable-field*/: `ion-input` value converted to a string before `SanitizeSscInput`
- src/app/pages/upload/upload.page.ts: `files?.[0]` when loading a file

→ To verify:
  - Local song: move the slider, playback resumes at the chosen position (also with a non-zero `startOffset`)
  - Browse: select a local song, the preview starts at the right position with no console error
  - Upload: edit a text field and a number field (offset, sample start), the value is kept and flagged as changed
  - Upload: load a `.sm`, a `.ssc` and an `.essc` file

## Commit: Typage générique des composants d'édition de l'upload (no-explicit-any)
Link: https://github.com/Fx73/Dance-Corp/commit/d25678e6e20c7aaef4d458724d8f6a79131672ef

- src/app/pages/upload/*: editable field, autocomplete, select and editable list components made generic (typing only, emitted values unchanged)

→ To verify:
  - Upload: edit each kind of field (text, number, genre, dance type and difficulty selects, BPM and background lists), changes are kept and flagged

## Commit: Typage du parsing et de la sérialisation (no-explicit-any)
Link: https://github.com/Fx73/Dance-Corp/commit/c2352e96bd68dec2812f1050c360f8e728233e51

- src/app/pages/upload/reader.ssc.ts: `getOrderedFields` uses `Object.entries`, `writeEsscValue` uses `String(value)`
- src/app/pages/upload/upload.page.ts: protected fields copied with `Object.assign`
- src/app/services/firestore/firestore.converter.ts: retyped (`DocumentData`), default parameter instead of `if (dto === undefined)`
- src/app/game/game-model/*: typed `fromJSON` (MusicDto, NoteDataDto, Measures, Player)

→ To verify:
  - Upload: load a song that already exists in the database, protected fields take the database values
  - Upload: export to `.essc` and compare with a previous export
  - Upload a song, then reload it from the database
  - Saved players and local songs reload correctly after a page refresh

## Commit: Typage des API externes : widget SoundCloud et flag zone.js (no-explicit-any)
Link: https://github.com/Fx73/Dance-Corp/commit/ed6082e1be043df7db7742dd534063d229f13203

- src/app/game/music-player/music-player-soundcloud/music-player-soundcloud.component.ts: `polling` initialized to `undefined` instead of `null`
- src/zone-flags.ts: `Object.assign(window, ...)` instead of `(window as any)`

→ To verify:
  - SoundCloud song: the position advances, pause and resume work

## Commit: Remove unused parameters required by API signatures
Link: https://github.com/Fx73/Dance-Corp/commit/9540ad00c393c2b7c5df0696aa55dc26097ca249

- src/app/shared/guard/game.guard.ts: unused `(route, state)` parameters removed from the `CanActivateFn`
- src/app/services/firestore/user.firestore.service.ts: unused `options` parameter removed from `fromFirestore` (`FirestoreDataConverter`)

→ To verify:
  - Start a game from browse: `/play/game/:musicId` opens (guard returns true)
  - Log in: the user profile (name, avatar, level, stats) loads from Firestore
