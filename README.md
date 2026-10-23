<div align="center">

![Dance Corp](./src/assets/Splash/BannerLite.png)

**A StepMania-style rhythm game engine, rebuilt from scratch for the web browser and the desktop.**

[![Website](https://img.shields.io/website?down_message=down&up_message=dance-corp.web.app&url=https://dance-corp.web.app)](https://dance-corp.web.app)
![Version](https://img.shields.io/github/package-json/v/fx73/Dance-Corp)
[![Deploy](https://img.shields.io/github/actions/workflow/status/fx73/Dance-Corp/deploy.yml?branch=master&label=deploy)](https://github.com/Fx73/Dance-Corp/actions/workflows/deploy.yml)
[![Last commit](https://img.shields.io/github/last-commit/fx73/Dance-Corp)](https://github.com/Fx73/Dance-Corp/commits)
[![DeepScan grade](https://deepscan.io/api/teams/17167/projects/27278/branches/870516/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=17167&pid=27278&bid=870516)
![IM2AG](https://img.shields.io/badge/IM2AG-Seal%20of%20Quality-blue)

![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![Ionic](https://img.shields.io/badge/Ionic-9-3880FF?logo=ionic&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-13-FFCA28?logo=firebase&logoColor=black)
![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-desktop-000000?logo=rust&logoColor=white)

[**▶ Play in your browser**](https://dance-corp.web.app) · [Wiki](https://github.com/Fx73/Dance-Corp/wiki) · [Report a bug](https://github.com/Fx73/Dance-Corp/issues)

</div>

---

## 🎵 About

Dance Corp recreates the StepMania / DDR experience with a rhythm game engine written from scratch in TypeScript. It aims at the same precise timing, a balanced scoring system and the feedback players expect from the original, while the web brings what a desktop game cannot: an online song catalog, chart sharing between players, and nothing to install.

Songs are never hosted: they are streamed from **YouTube** or **SoundCloud**. The **desktop version** (Tauri) can also play songs stored on your computer, which never leave your device.

## ✨ Highlights

| | |
|---|---|
| 🎯 **Precise engine** | BPM changes and stops on a beat timeline, judgment windows measured in seconds, not frames. |
| 👥 **Local multiplayer** | Up to **4 players** on the same screen, each with their own pad, chart and difficulty. |
| 🎮 **Any controller** | Dance pads and gamepads through the Gamepad API, or the keyboard, with full key binding and a pad test page. |
| 🌐 **Online catalog** | Browse the community catalog, upload your own `.sm` / `.ssc` charts, keep your high scores per chart. |
| 📊 **Difficulty radar** | Every chart is analyzed on upload and scored on 5 criteria: endurance, speed, technical, burst and chaos. |
| 📣 **Announcers** | Voiced announcers and a crowd that react to your combo and your performance. |
| 🖥️ **Desktop app** | Tauri build with local songs, **Discord** Rich Presence and **Steam** integration. |

## 📌 Feature status

| Notes | | Timing and effects | | Score and progression | |
|---|:---:|---|:---:|---|:---:|
| Tap notes | ✅ | BPM changes | ✅ | 1,000,000-point scoring | ✅ |
| Hold notes | ✅ | Stops | ✅ | Combo tracking | ✅ |
| Mines | ✅ | Background changes | ✅ | Grades (S to E) | ✅ |
| Roll notes | 🟡 | Warps | ❌ | High scores per chart | ✅ |
| Minefields | ❌ | Speed changes | ❌ | Leaderboards | ❌ |
| Fakes, hidden notes | ❌ | Scroll changes | ❌ | Achievement badges | ❌ |

✅ Supported · 🟡 Partial (rolls are played as holds) · ❌ Not yet. The details are in [MISSING_FEATURES.md](Documentation/MISSING_FEATURES.md).

**Modes**: Dance Single and Dance Double, local multiplayer up to 4 players, training mode.

**Accounts**: email, Google and Facebook sign-in, with high scores saved to your profile.

## 📖 Documentation

The [wiki](https://github.com/Fx73/Dance-Corp/wiki) goes into the details:

- [Gameplay](https://github.com/Fx73/Dance-Corp/wiki/Gameplay): judgments, score, life gauge, grades and the difficulty radar
- [Chart Format](https://github.com/Fx73/Dance-Corp/wiki/Chart-Format): supported files and the `.essc` format
- [Architecture](https://github.com/Fx73/Dance-Corp/wiki/Architecture): the game engine, the data layers and the project structure
- [Development](https://github.com/Fx73/Dance-Corp/wiki/Development): setup, environments, CI/CD and the contribution workflow

## 🚀 Getting started

You need [Node.js](https://nodejs.org/) 24 and the [Ionic CLI](https://ionicframework.com/docs/cli), plus [Rust](https://www.rust-lang.org/tools/install) for the desktop app.

```bash
npm install
ionic serve          # web app on http://localhost:8100
npx tauri dev        # desktop app
```

See [Development](https://github.com/Fx73/Dance-Corp/wiki/Development) for the rest.

## 🙏 Credits

- All visual assets are made by the author or come from free-to-use resources.
- Announcer voices (CC-BY): **Aimee Smith** (female announcers) and **VoiceBosch** (male announcer).
- Inspired by [StepMania](https://www.stepmania.com/) and Dance Dance Revolution.

<div align="center">

Have an idea or found a bug? [Open an issue](https://github.com/Fx73/Dance-Corp/issues).

</div>
