# Missing features

Features not supported yet. Remove an entry once it is implemented.

- **High priority**: core features whose absence blocks part of the game (some songs or charts cannot be played correctly).
- **Low priority**: optional content that blocks nothing.

---

## High priority

- **Per-chart `#OFFSET` (SSC split timing)**
  Since version 0.7 of the `.ssc` format, a chart can define its own `#OFFSET`, and its own timing tags (`#BPMS`, `#STOPS`…). The parser only reads the song-level `#OFFSET`, so a chart with its own offset plays out of sync.
  Dedicated per-chart timing is not wanted. Instead, convert on import: shift the chart's notes by adding or removing beats so that it matches the song offset. The offset difference is converted to beats at the first BPM; when it is not a whole number of rows, the shift needs a finer subdivision or can only be approximated. Per-chart BPMs or stops that differ from the song cannot be converted this way.

## Low priority

- **Achievement badges**
  Badges rewarding player achievements. Content only, blocks nothing.
