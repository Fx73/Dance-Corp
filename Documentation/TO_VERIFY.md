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

## Commit: Replace deprecated ion-img with native img
Link: https://github.com/Fx73/Dance-Corp/commit/734e63312300ae8be977662c74dac822c5626f0c

- browse, browse-upload, upload, user-profile pages and header: `<ion-img>` replaced by `<img>`, with `display: block` / `object-fit: contain` to keep the `ion-img` rendering; jackets use `loading="lazy"`

→ To verify:
  - Browse and browse-upload: jackets are not stretched and keep their black background; single/double icon on the chart cards
  - Upload: background and jacket previews take the card width
  - User profile: the avatar stays round
  - Header: logo size, clicking it goes to home
  - The `ion-img` deprecation warning is gone from the console

## Commit: Fix user music converter key so notes become UserNoteDto
Link: https://github.com/Fx73/Dance-Corp/commit/9858943905c305871b6b089d1fb253fa41d6cdb4

- src/app/services/firestore/user.firestore.service.ts: **bug fix**, subtype key `"notes:"` renamed to `notes`

→ To verify:
  - Log in: the user stats per chart (passed, times played, high score) load as before in browse and the profile

## Commit: Read every player's chart index from the game URL
Link: https://github.com/Fx73/Dance-Corp/commit/557c6dcbe9c7bab2cc1234ed972cc53979e6e60b

- src/app/game/game.page.ts: **bug fix**, `queryParamMap.getAll('notes')` instead of `get('notes')?.split(',')`

→ To verify:
  - 1 player: a game starts with the selected chart
  - 2 players with different charts: each player gets their own chart

## Commit: Save each player's stats against the chart they played
Link: https://github.com/Fx73/Dance-Corp/commit/aecd1f1dcaee60e6d4f782d9fe83790be461f896

- src/app/game/game.manager.ts: **bug fix**, `GameOver()` saves each round under its selected chart instead of `noteData[0]`
- src/app/game/game.page.ts: **bug fix**, the Discord presence shows the level of the selected chart

→ To verify:
  - Play a chart that is not the first one of the music: the score and "passed" are shown on that chart in browse
  - Tauri: the Discord presence shows the played level

## Commit: Replace re-uploaded notes in the music cache instead of duplicating
Link: https://github.com/Fx73/Dance-Corp/commit/410da919b78436478a601e3a1facf51220db21a8

- src/app/services/local-storage/music.cache.service.ts: **bug fix**, `UploadNotesInBase()` replaces notes with the same `chartName` instead of appending them

→ To verify:
  - Upload: re-upload an existing note, then open browse without a full refresh: the chart is listed once, with the new content
  - Upload a new note: it is added to the list

## Commit: Start the crowd sound fade-out once its duration is known
Link: https://github.com/Fx73/Dance-Corp/commit/a08a8da908cb49eee344a5fe127ac317b1f3ed3d

- src/app/services/gameplay/announcer.service.ts: **bug fix**, the crowd fade-out is scheduled on `loadedmetadata`, as `audio.duration` is `NaN` right after `play()`

→ To verify:
  - End of a game: applause or boos now play until 4 s before their end, then fade out (they were cut almost at once before)

## Commit: Make UserGuard wait for the session and the user document
Link: https://github.com/Fx73/Dance-Corp/commit/703b1b1f9744906d4650054aefbe3c794efd2e42

- src/app/shared/guard/user.guard.ts: **bug fix**, waits for `authStateReady()` instead of a 500 ms timeout, then for `userData` to be set (5 s timeout, it was never awaited); redirects with a `UrlTree`

→ To verify:
  - Logged out: `/upload`, `/browse-upload` and `/user-profile` redirect to home
  - Logged in: navigating to these pages from the menu opens them
  - Logged in: reloading these pages (F5) opens them with the user loaded (profile shows name and stats, upload works with no "User not authenticated")

## Commit: Redirect browse and game to player selection when players are not ready
Link: https://github.com/Fx73/Dance-Corp/commit/40d60f76012fedc3f50e51431978a308af35b3ae

- src/app/shared/guard/players.guard.ts: **bug fix**, `gameGuard` replaced by `playersGuard` on `/play/browse` and `/play/game/:musicId`, redirects to `/play/player-selection` when a player has no gamepad or an undetected one
- src/app/services/userconfig.service.ts: `ArePlayersReady()` shared with the player selection page; `isReady` removed (always true)

→ To verify:
  - Fresh profile (localStorage cleared): open `/play/browse` directly, it redirects to player selection with no console error
  - Keyboard player: reload `/play/browse`, it stays on browse
  - Gamepad player: reload `/play/browse`, it redirects to player selection; press a button, Start goes back to browse
  - Normal flow: player selection → browse → game → back to browse

## Commit: Remove DancePadKeyboard window listeners when the pad is destroyed
Link: https://github.com/Fx73/Dance-Corp/commit/09555de9bbe67b939110580e0b20b5d2e4362627

- src/app/game/game-controller/*: **bug fix**, `IDancePad.Destroy()` added; `DancePadKeyboard` removes its `keydown` / `keyup` listeners, `DancePadGamepad` has nothing to release
- src/app/game/game.manager.ts: `DestroyGame()` destroys each round's pad
- src/app/pages/browse/browse.page.ts: `ngOnDestroy()` destroys the browse pads

→ To verify:
  - Keyboard player: browse navigation with the arrows, play a game, back to browse, play again: inputs work every time
  - Upload: the note test works with the keyboard, close it and reopen it
  - Gamepad player: same flow, inputs still work

## Commit: Stop the upload page loading forever when the music is not found
Link: https://github.com/Fx73/Dance-Corp/commit/9faed688d302786b1c89fd359001ceee56dcd330

- src/app/pages/upload/upload.page.ts: **bug fix**, `StartLoad()` stops loading and shows the "Music not found" toast when the music is neither local nor in the database; dead `DeepClone()` fallback removed

→ To verify:
  - `/upload?music=<unknown id>`: error toast, then the file picker is shown
  - Database-only music: shown read only, "Edit Music" makes it editable
  - Local music (with or without a database version): opens in edit mode as before

## Commit: Send the selected charts to the game by chartName
Link: https://github.com/Fx73/Dance-Corp/commit/560619692a1d338379dab7c23d6924fb5a5e4b62

- src/app/pages/browse/browse.page.ts: **bug fix**, `RunGame()` sends the selected `chartName`s in the `notes` query param instead of indexes into the filtered list
- src/app/game/game.page.ts: **bug fix**, chart names resolved in `music.noteData`; unknown chart name redirects to home

→ To verify:
  - 1 player, music with single and double charts: each selected chart is the one played (level, notes), for several charts of the list
  - 2 players with different charts: each player gets their own chart
  - After the game: score and "passed" are shown on the played chart in browse
  - Chart name with spaces or special characters: the game starts

## Commit: Move scoring, judgment and announcer values to CONFIG
Link: https://github.com/Fx73/Dance-Corp/commit/00ded672f5b371cda855cf60ba988da1b0479f07

- src/app/game/constants/game-config.ts: `JUDGMENT`, `SCORE`, `PERFORMANCE` and `ANNOUNCER` sections, same values as before
- src/app/game/game-model/gameRound.ts, src/app/services/gameplay/announcer.service.ts, src/app/game/game.manager.ts: inline values replaced by `CONFIG`; `SatisfactionType` enum instead of `0` / `1` / `2`; `GameRound.MAX_SCORE` moved to `CONFIG.SCORE.MAX`

→ To verify:
  - A game plays as before: judgments, score, performance bar, fail
  - Announcer combo lines and end of game applause still trigger

## Commit: Remove debug logs and silence the console in production
Link: https://github.com/Fx73/Dance-Corp/commit/21354a2e0ac4aaaa6d0cec79fbff19dcd3cf3df5

- 14 files: debug `console.log` removed (object dumps, per-arrow judgments, satisfaction, protected field check, chart name parsing, token maps, email on register error)
- src/app/shared/console-output.ts: `SilenceConsole()` and `productionConsole`
- src/main.ts: `SilenceConsole()` called in production
- src/app/app.component.ts: toasts log through `productionConsole`
- browse and browse-upload pages: infinite scroll easter egg logs through `productionConsole`

→ To verify:
  - `ionic serve` (development): the remaining logs show (loading, cache sync, game start and game over)
  - Production build (`npm run build`, then serve `website/www`): only toasts, errors and the infinite scroll message show in the console
  - Tauri build: same as production

## Commit: Add a dev Firebase project and split CI from deployment
Link: https://github.com/Fx73/Dance-Corp/commit/74bdcf4bcc92c2329414404b33c319684c1a4e55

Tested: `ng build --configuration=dev` only contains `dance-corp-dev`, `ng build --configuration=production` only contains `dance-corp`.

- src/environments/environment.ts, environment.prod.ts: Firebase config moved here from src/app.config.ts, dev project by default
- src/main.ts: Analytics only starts when a `measurementId` is set
- angular.json: new `dev` build configuration
- src-tauri/tauri.dev.conf.json: separate "DanceCorp Dev" desktop app for dev builds
- .github/workflows/ci.yml, deploy.yml: replace build_deploy_web.yml and build_desktop.yml

→ To verify:
  - The CI workflow passes on a PR: lint, build, preview URL comment, desktop build
  - A push to `dev` deploys to dance-corp-dev, a push to `master` to dance-corp
  - The desktop artifact contains the `.msi` and `.exe` installers
  - The "DanceCorp Dev" app installs next to the release app and keeps its own AppData
  - Production still records Analytics

## Commit: Deploy the Firestore rules from the repo and tighten them
Link: https://github.com/Fx73/Dance-Corp/commit/9106f353e00a06c5580a637dc4ac780ec91d544f

Tested: 32 allow/deny cases in the Firestore emulator (protected fields, bpms with and without notes, delete, metadata shape and index guard, fresh DB). Rules deployed to dance-corp-dev.

- website/firestore.rules: delete blocked while notes remain, bpms protected once notes exist, metadata writes restricted and checked
- src/app/services/firestore/music.firestore.service.ts: `GetProtectedFields()` adds `bpms` when the music has notes; `AddGenres` creates `musicdata` if missing
- src/app/pages/upload/upload.page.ts: uses `GetProtectedFields()`
- .github/workflows/deploy.yml: deploys the rules and indexes

→ To verify:
  - Upload a music, add notes, edit it, delete its notes then the music, on the dev site
  - Changing the bpms of a music without notes works; with notes, the client refuses it with a clear message
  - The Deploy workflow deploys the rules (the service account may need the Firebase Rules Admin role)
