# Missing features

Features not supported yet. Remove an entry once it is implemented.

- **High priority**: core features whose absence blocks part of the game (some songs or charts cannot be played correctly).
- **Low priority**: optional content that blocks nothing.

---

## High priority

- **Per-chart `#OFFSET` (SSC split timing)**
  Since version 0.7 of the `.ssc` format, a chart can define its own `#OFFSET`, and its own timing tags (`#BPMS`, `#STOPS`…). The parser only reads the song-level `#OFFSET`, so a chart with its own offset plays out of sync.
  Dedicated per-chart timing is not wanted. Instead, convert on import: shift the chart's notes by adding or removing beats so that it matches the song offset. The offset difference is converted to beats at the first BPM; when it is not a whole number of rows, the shift needs a finer subdivision or can only be approximated. Per-chart BPMs or stops that differ from the song cannot be converted this way.

- **Warps (`#WARPS`)**
  Warps are parsed into `MusicDto.warps`, but `BeatManager` only uses BPM changes and stops. The skipped beats are played, so every note after a warp is out of sync.

- **Roll notes**
  `ArrowManager` builds rolls as holds: they are kept by holding the panel instead of tapping it repeatedly, so a chart with rolls is not played as written.

## Low priority

- **Speed and scroll changes (`#SPEEDS`, `#SCROLLS`)**
  Parsed into `MusicDto.speeds` and `MusicDto.scrolls`, not applied by the display. Visual only: the timing stays right, but the arrows do not move as the chart intends.

- **Fake notes**
  Read from the file (`7`) and ignored by `ArrowManager`. They should be displayed without being judged.

- **Hidden notes**
  Read from the file (`8`) and ignored by `ArrowManager`.

- **Minefields**
  Read from the file (`6`, ending with `3`) and ignored by `ArrowManager`.

- **Combo bonus in the score**
  The combo is tracked and shown, but does not count in the score.

- **Leaderboards**
  High scores are saved per chart for each user, but there is no ranking between players.

- **Achievement badges**
  Badges rewarding player achievements. Content only, blocks nothing.
