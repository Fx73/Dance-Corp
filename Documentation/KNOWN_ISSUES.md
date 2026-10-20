# Known issues

Bugs found but not fixed yet, and deprecations to migrate. Remove an entry once it is fixed.

---

## Bugs

- **`/play/browse` crashes without a configured player**
  Reloading the page or opening it from a direct link (without going through player selection) throws `Cannot read properties of undefined (reading 'index')` in `initPlayerInput` (`browse.page.ts`, `player.gamepad!.index`), then a second error on `musicCards.toArray()` in a `setTimeout`.
  Possible fix: guard with `?.` and redirect to player selection when no player is configured.

- **Genre autocomplete: suggestions unreachable with the keyboard**
  `onBlur` clears the suggestion list when the input loses focus, so pressing Tab to reach a suggestion closes the list first.
  Possible fix: arrow up/down + Enter navigation from the input, with `aria-activedescendant`.

- **User music converter: notes never converted to `UserNoteDto`**
  In `user.firestore.service.ts`, the converter subtype key is `"notes:"` (with a colon) while the `UserMusicDto` field is `notes`, so the subtype never matches. Notes read from Firestore stay plain objects: `UserNoteDto` default values (`passed = false`, `highScore = 0`…) are not applied when a field is missing in the document.
  Possible fix: rename the key to `notes`.

- **Selected chart index differs between browse and game**
  `browse.page.ts` indexes into `musicNotes()`, which is filtered (single player → `DanceSingle` only) and re-sorted, but `game.page.ts` / `GameManager` index into the raw `music.noteData`. When a music has a double chart, a single player can be sent a different chart than the one selected.
  Possible fix: pass the `chartName` instead of an index, or resolve the index against the same filtered list.

- **Multiplayer: only player 0 receives a chart index (unverified)**
  `browse.page.ts` navigates with `queryParams: { notes: [..] }`, which Angular serializes as `notes=0&notes=1`, while `game.page.ts` reads `queryParamMap.get('notes')?.split(',')`, which only returns the first value. Player 2+ would get `noteData[undefined]`.
  Possible fix: use `getAll('notes')`, or join the array before navigating.

- **Scores saved against the wrong chart**
  `GameManager.gameOver()` calls `updateUserStatsFromRound(music.id, music.noteData[0].chartName, gameRound)` for every round, so all players' stats go to the first chart of the music instead of the one they played. Same `noteData[0]` shortcut in the Discord presence of `game.page.ts`.
  Possible fix: use each `gameRound`'s own note data.

- **`UserGuard`: user data fetch is never awaited**
  `canActivate()` calls `guardWaitForUserDataFetch()` without `await`; a Promise is always truthy, so `!isUserFetched` is never true and the check is skipped.

- **`DancePadKeyboard` listeners are never removed**
  The constructor adds `keydown`/`keyup` listeners on `window` with no way to remove them. A new instance is created on each browse page init and each `GameRound`, so listeners accumulate during a session.
  Possible fix: add a `destroy()` to `IDancePad` and call it on leave.

- **Note upload duplicates notes in the local music cache**
  `MusicCacheService.uploadNotesInBase()` does `music.noteData.concat(notes)`, while Firestore replaces notes with the same `chartName`. Re-uploading an existing note leaves a duplicate in the cache until the next full refresh.

- **Upload page: DB fallback never runs in `startLoad()`**
  `musicData` is initialised with `new MusicDto()` and never set to `null`, so `if (!this.musicData)` is always false and the `musicDataDb.deepClone()` fallback is dead code.

- **Crowd sound fade-out starts immediately (unverified)**
  `AnnouncerService.playAudio()` schedules the fade with `audio.duration * 1000 - fadeDuration` right after `play()`, when `duration` is usually still `NaN` (metadata not loaded); `setTimeout(NaN)` runs at once.
  Possible fix: schedule the fade on `loadedmetadata`.

- **Music offset fallback is dead code**
  In the `MusicDto` constructor, `parseFloat(tokenMap["offset"]) ?? parseFloat(tokenMap["beat0OffsetInSeconds"])` never uses the fallback (`parseFloat` returns `NaN`, not `null`), and the whole expression is guarded by `tokenMap["offset"]` being truthy.

## Deprecations

- **`<ion-img>`**: deprecated in Ionic 9, removed in Ionic 10 (runtime warning on every page). Replace with a native `<img loading="lazy">`.

## Maintenance

- **`npm audit`**: 4 high severity vulnerabilities not addressed (`npm audit fix --force` may introduce breaking changes).
- **`.browserslistrc`**: targets Chrome/Edge/Firefox ≥ 112, while Angular 22 only supports them from version 119.

## Improvements

- **Pass identifiers, not indexes, across pages and layers**
  Chart, music and player indexes travel between browse, the URL and the game (`selectedNotesIndex`, `selectedMusicIndex` over two concatenated lists). Three of the bugs above come from this. Prefer `chartName` / `music.id`.

- **Floating promises**
  Async calls are often fired without `await` (`addGenres()`, `updateMusicIndex()`, `updateCache()` in `catch` blocks, `deleteNoteInBase()` followed by `loadDbMusic()`). Await them, or mark intentional ones with `void`. The ESLint rule `@typescript-eslint/no-floating-promises` would list them all. Also review the 4 empty `catch { }` blocks that swallow errors.

- **Duplicated persistence block in `MusicCacheService`**
  "update `musics` + `localStorage.setItem` + `registry.add` + save registry" is repeated about 8 times. Extract a `persistMusic(music)` / `removeMusic(id)` helper.

- **Logging**
  60 `console.log`, some in per-frame or per-arrow paths (`GameRound.checkArrowPress`, `AnnouncerService.changeSatisfaction`, chart name parsing, protected field check). Replace with a small logger that can be silenced, or remove debug traces.

## Code style to harmonize

- **Semicolons**: about 85% of statements end with one, while the target style is semicolon-free. Convert with `@stylistic/eslint-plugin` (`semi: ['error', 'never']`, auto-fixable) and enable `no-unexpected-multiline` to catch lines that would be joined to the previous one.
- **Class member order**: most classes put `inject()` fields before the `Constants` region, and static methods are not grouped at the bottom (`MusicDto.fromJSON`, toasts in `AppComponent`). Reorder to: Constants region, `inject()` fields, the rest, `Statics` region.
- **Braceless loops**: 4 `for` / `while` without braces (e.g. `game.manager.ts`). Loops always take braces.
- **Blank lines**: runs of 3–4 empty lines between methods. Use a single blank line.
- **Method naming**: some methods are PascalCase (`EndFail`, `EndVictory`, `GetAllMusics`, `TestNote`, `GetPlayerStatus`, `InitBackgroundMusic`, `StartBackgroundMusic`, `PauseBackgroundMusic`). Use camelCase.
- **Region markers**: `//#region` / `//#endregion` mostly, but `//#Region` / `//#EndRegion` in `game.manager.ts`. Use the lowercase form.
- **Comment language**: comments mix French and English (13 files). Translate to English.
- **Typos in comments**: `DDetermine` (`music.firestore.service.ts`), `exctract` (`upload.page.ts`).
- **Magic numbers**: scoring and announcer values (`0.8`, `0.6`, `-4`, `-20`, `30`…) are inline while `CONFIG` exists. Move tunable gameplay values to `CONFIG`.
- **Non-null assertions**: 62 `!` remain, many on values that are never null (`this.music!`), some on values that can be (`player.gamepad!.index`). Conversely, `?? []` is used on results that can't be nullish (after `.filter()`).
