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

## Deprecations

- **`<ion-img>`**: deprecated in Ionic 9, removed in Ionic 10 (runtime warning on every page). Replace with a native `<img loading="lazy">`.

## Maintenance

- **`npm audit`**: 4 high severity vulnerabilities not addressed (`npm audit fix --force` may introduce breaking changes).
- **`.browserslistrc`**: targets Chrome/Edge/Firefox ≥ 112, while Angular 22 only supports them from version 119.
