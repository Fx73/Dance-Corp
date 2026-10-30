import { MusicDto, NoteDataDto } from "src/app/game/game-model/music.dto"
import { vi } from "vitest"

import { AnnouncerService } from "src/app/services/gameplay/announcer.service"
import { ArrowDirection } from "src/app/game/constants/arrow-direction.enum"
import { ArrowManager } from "src/app/game/game-model/arrows/arrowManager"
import { ArrowType } from "src/app/game/constants/arrow-type.enum"
import { GameManager } from "src/app/game/game.manager"
import { GameRound } from "src/app/game/game-model/gameRound"
import { IMusicPlayer } from "src/app/game/music-player/IMusicPlayer"
import { Player } from "src/app/game/game-model/player"
import { UserCacheService } from "src/app/services/local-storage/user.cache.service"

/** A key press at a music time, in seconds, held for `duration` seconds */
export type Input = { time: number, direction: ArrowDirection, duration?: number }

export type SimulationResult = {
  round: GameRound
  manager: GameManager
  announcer: { ChangeSatisfaction: ReturnType<typeof vi.fn>, PlayAnnouncer: ReturnType<typeof vi.fn>, PlayCrowdOneShot: ReturnType<typeof vi.fn> }
  userCache: { GetMusicStats: ReturnType<typeof vi.fn>, UpdateUserStatsFromRound: ReturnType<typeof vi.fn> }
}

// A tap is held long enough to be seen by the next frame
const TAP_DURATION = 0.04
// Stops a simulation that never ends
const MAX_DURATION = 120
const KEYS = ["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"]

/** Music player driven by the fake clock: its time starts when it is played */
class FakeMusicPlayer {
  musicUrl = "fake"
  startedAt: number | null = null

  Play() { this.startedAt = performance.now() }

  Stop() { this.startedAt = null }

  GetCurrentTime(): number {
    return this.startedAt === null ? 0 : (performance.now() - this.startedAt) / 1000
  }

  SetToTime() { /* Not used by the game loop */ }
}

/** Music with its timing tags, written like in a .ssc file */
export function CreateMusic(tags: { bpms: string, stops?: string, offset?: number }): MusicDto {
  return new MusicDto({ title: "Simulation", artist: "Test", bpms: tags.bpms, stops: tags.stops ?? "", offset: String(tags.offset ?? 0) })
}

/** Chart from its measures, each one written as rows of digits like in a .ssc file */
export function CreateChart(...measures: string[][]): NoteDataDto {
  return new NoteDataDto({ meter: "5", notes: measures.map(rows => rows.join("\n")).join("\n,\n") })
}

/** Music time of a beat, computed independently from BeatManager */
export function TimeOfBeat(music: MusicDto, beat: number): number {
  const bpms = [...music.bpms].sort((a, b) => a.time - b.time)
  let time = -music.offset
  for (let i = 0; i < bpms.length && bpms[i].time < beat; i++) {
    const end = Math.min(beat, bpms[i + 1]?.time ?? Infinity)
    time += (end - bpms[i].time) * 60 / bpms[i].value
  }
  // A stop on the beat of an arrow freezes the beat on it: the arrow is judged when the stop starts
  for (const stop of music.stops) {
    if (stop.time < beat) time += stop.value
  }
  return time
}

/** Inputs of a player who hits every tap and hold right on time, shifted by `delay` seconds */
export function PerfectInputs(music: MusicDto, chart: NoteDataDto, delay: number = 0): Input[] {
  return new ArrowManager(chart).arrowMap
    .filter(arrow => arrow.type !== ArrowType.Mine)
    .map(arrow => ({
      time: TimeOfBeat(music, arrow.beatPosition) + delay,
      direction: arrow.direction,
      // Holds are released a bit after their end
      duration: arrow.beatEnd === null ? undefined : TimeOfBeat(music, arrow.beatEnd) - TimeOfBeat(music, arrow.beatPosition) + 0.1,
    }))
}

function KeyboardPlayer(): Player {
  const player = new Player()
  player.gamepad = { index: -1, id: "keyboard" }
  return player
}

function CreateAnnouncer(): SimulationResult["announcer"] {
  return { ChangeSatisfaction: vi.fn(), PlayAnnouncer: vi.fn(), PlayCrowdOneShot: vi.fn() }
}

/**
 * Plays a whole game with the real GameManager, on a fake clock: the frames, the music time
 * and the key events are all driven by the simulation, millisecond by millisecond.
 * Call it between vi.useFakeTimers() and vi.useRealTimers().
 */
export async function Simulate(music: MusicDto, chart: NoteDataDto, inputs: Input[], isTrainingMode: boolean = false): Promise<SimulationResult> {
  const announcer = CreateAnnouncer()
  const userCache = { GetMusicStats: vi.fn(() => ({ notes: [] })), UpdateUserStatsFromRound: vi.fn() }
  const musicPlayer = new FakeMusicPlayer()

  const manager = new GameManager(music, [KeyboardPlayer()], [chart], isTrainingMode, userCache as unknown as UserCacheService, announcer as unknown as AnnouncerService)
  manager.RegisterExternalComponents(musicPlayer as unknown as IMusicPlayer)
  const round = manager.gameRounds[0]

  const started = manager.StartGame()
  const startedAt = musicPlayer.startedAt ?? 0

  // Key events on the clock, in milliseconds
  const events = inputs.flatMap(input => [
    { at: startedAt + input.time * 1000, type: "keydown", key: KEYS[input.direction] },
    { at: startedAt + (input.time + (input.duration ?? TAP_DURATION)) * 1000, type: "keyup", key: KEYS[input.direction] },
  ]).sort((a, b) => a.at - b.at)

  try {
    while (!manager.isGameOver && performance.now() - startedAt < MAX_DURATION * 1000) {
      while (events.length > 0 && events[0].at <= performance.now()) {
        const event = events.shift()!
        window.dispatchEvent(new KeyboardEvent(event.type, { key: event.key }))
      }
      await vi.advanceTimersByTimeAsync(1)
    }
    await started
  } finally {
    manager.DestroyGame()
  }

  return { round, manager, announcer, userCache }
}
