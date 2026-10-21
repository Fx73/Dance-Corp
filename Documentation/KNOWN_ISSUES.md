# Known issues

Bugs found but not fixed yet, and deprecations to migrate. Remove an entry once it is fixed.

---

## Bugs

- **Genre autocomplete: suggestions unreachable with the keyboard**
  `OnBlur` clears the suggestion list when the input loses focus, so pressing Tab to reach a suggestion closes the list first.
  Possible fix: arrow up/down + Enter navigation from the input, with `aria-activedescendant`.

## Maintenance

- **`npm audit`**: 6 vulnerabilities (5 high, 1 moderate), accepted for now. Do not run `npm audit fix --force`: it downgrades `firebase` to 9.14.0 and `@angular/build` to 22.1.9.
  - `@grpc/grpc-js` 1.9.16, pulled by `@firebase/firestore` (`~1.9.0`): only used by the Node build of Firestore, the browser build uses WebChannel. Not in the bundle. Wait for a Firebase update.
  - `vite` 8.3.0, pinned by `@angular/build` 22.2.3: only used by `ng serve` (`ng build` uses esbuild). Dev only. Wait for `@angular/build` 22.2.4.

## Improvements

- **Pass identifiers, not indexes, across pages and layers**
  Charts now travel by `chartName` from browse to the game, but music and player indexes still do (`selectedMusicIndex` over two concatenated lists, `noteSelected` in `GameManager`). Prefer `music.id` / `chartName`.

- **Floating promises**
  Async calls are often fired without `await` (`AddGenres()`, `UpdateMusicIndex()`, `UpdateCache()` in `catch` blocks, `DeleteNoteInBase()` followed by `LoadDbMusic()`). Await them, or mark intentional ones with `void`. The ESLint rule `@typescript-eslint/no-floating-promises` would list them all. Also review the 4 empty `catch { }` blocks that swallow errors.

- **Duplicated persistence block in `MusicCacheService`**
  "update `musics` + `localStorage.setItem` + `registry.add` + save registry" is repeated about 8 times. Extract a `PersistMusic(music)` / `RemoveMusic(id)` helper.

## Code style to harmonize

- **Non-null assertions**: the assertions that were unnecessary for the type checker are removed. The remaining `!` are on values typed as nullable, some of which can really be null at runtime. Each one needs a guard or a type fix, which changes behavior: handle them with the related bugs.
- **Optional chains on non-nullable types**: about 10 `?.` are on values typed as non-nullable (reported by `@typescript-eslint/no-unnecessary-condition`). They were kept on purpose, as data read from Firestore or localStorage may not match its type.
