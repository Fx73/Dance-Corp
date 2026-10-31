// Storage API names: kept as declared by the DOM
/* eslint-disable @typescript-eslint/naming-convention */
import { MusicDto, NoteDataDto } from "src/app/game/game-model/music.dto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MusicCacheService } from "src/app/services/local-storage/music.cache.service"
import { MusicFirestoreService } from "src/app/services/firestore/music.firestore.service"
import { MusicLocalService } from "src/app/services/local-storage/local.music.service"
import { TestBed } from "@angular/core/testing"

type Update = { newMusicIds: string[], toUpdateMusicIds: string[], toDeleteMusicIds: string[], updatedAt: number }

const NO_UPDATE: Update = { newMusicIds: [], toUpdateMusicIds: [], toDeleteMusicIds: [], updatedAt: 1 }

// Node 25+ defines its own localStorage global, unusable without --localstorage-file, over the jsdom one
class MemoryStorage implements Storage {
  private items: Map<string, string> = new Map()

  get length(): number { return this.items.size }

  clear() { this.items.clear() }

  getItem(key: string): string | null { return this.items.get(key) ?? null }

  key(index: number): string | null { return [...this.items.keys()].at(index) ?? null }

  removeItem(key: string) { this.items.delete(key) }

  setItem(key: string, value: string) { this.items.set(key, String(value)) }
}

function Chart(chartName: string, meter: number = 5): NoteDataDto {
  const chart = new NoteDataDto()
  chart.chartName = chartName
  chart.meter = meter
  return chart
}

/** Music of id "artist-<title>" */
function Music(title: string, ...charts: NoteDataDto[]): MusicDto {
  const music = new MusicDto()
  music.title = title
  music.artist = "Artist"
  music.noteData = charts
  return music
}

function Ids(musics: MusicDto[]): string[] {
  return musics.map(music => music.id)
}

/** Firestore service serving the musics of `server`, by copy, like a real read */
function CreateFirestore(server: MusicDto[]) {
  return {
    GetAllMusics: vi.fn(async () => server.map(music => music.DeepClone())),
    GetUpdate: vi.fn<(timestamp: number, ids: Set<string>) => Promise<Update | null>>(async () => NO_UPDATE),
    GetMusicListWithId: vi.fn(async (ids: string[]) => server.filter(music => ids.includes(music.id)).map(music => music.DeepClone())),
    UploadMusic: vi.fn(async () => undefined),
    UpdateMusic: vi.fn(async () => undefined),
    DeleteMusic: vi.fn(async () => undefined),
    UploadNotes: vi.fn(async () => undefined),
    DeleteNote: vi.fn(async () => undefined),
  }
}

describe("MusicCacheService", () => {
  let firestore: ReturnType<typeof CreateFirestore>
  let localRegistry: Set<string>

  /** A new service reads the cache from localStorage, like after a page reload */
  function CreateCache(): MusicCacheService {
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      providers: [
        { provide: MusicFirestoreService, useValue: firestore },
        { provide: MusicLocalService, useValue: { registry: localRegistry } },
      ],
    })
    return TestBed.inject(MusicCacheService)
  }

  /** Cache after a first start on the musics of `server` */
  async function CreateLoadedCache(server: MusicDto[]): Promise<MusicCacheService> {
    firestore = CreateFirestore(server)
    const cache = CreateCache()
    await cache.UpdateCache()
    return cache
  }

  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage())
    firestore = CreateFirestore([])
    localRegistry = new Set()
    vi.spyOn(console, "log").mockImplementation(() => undefined)
    vi.spyOn(console, "warn").mockImplementation(() => undefined)
    vi.spyOn(console, "error").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe("UpdateCache", () => {
    it("loads the whole catalog on the first start, and keeps it after a reload", async () => {
      firestore = CreateFirestore([Music("a"), Music("b")])
      const cache = CreateCache()

      expect(await cache.UpdateCache()).toEqual({ added: 2, updated: 0, deleted: 0 })
      expect(Ids(cache.musics)).toEqual(["artist-a", "artist-b"])
      expect(Ids(CreateCache().musics)).toEqual(["artist-a", "artist-b"])
    })

    it("then only fetches the added and updated musics, and removes the deleted ones", async () => {
      const server = [Music("a"), Music("b"), Music("c")]
      await CreateLoadedCache(server)
      server[1].genre = "rock"
      server.push(Music("d"))
      firestore = CreateFirestore(server)
      let knownIds: string[] = []
      firestore.GetUpdate.mockImplementation(async (_timestamp: number, ids: Set<string>) => {
        knownIds = [...ids]
        return { newMusicIds: ["artist-d"], toUpdateMusicIds: ["artist-b"], toDeleteMusicIds: ["artist-c"], updatedAt: 42 }
      })
      const cache = CreateCache()

      expect(await cache.UpdateCache()).toEqual({ added: 1, updated: 1, deleted: 1 })
      expect(knownIds).toEqual(["artist-a", "artist-b", "artist-c"])
      expect(firestore.GetAllMusics).not.toHaveBeenCalled()
      expect(firestore.GetMusicListWithId.mock.calls).toEqual([[["artist-b"]], [["artist-d"]]])
      // An updated music keeps its place in the list
      expect(Ids(cache.musics)).toEqual(["artist-a", "artist-b", "artist-d"])
      expect(cache.musics[1].genre).toBe("rock")

      const reloaded = CreateCache()
      expect(Ids(reloaded.musics)).toEqual(["artist-a", "artist-b", "artist-d"])
      expect(reloaded.GetMusic("artist-c")).toBeNull()
      await reloaded.UpdateCache()
      expect(firestore.GetUpdate.mock.lastCall?.[0]).toBe(42)
    })

    it("returns null when the cache is up to date", async () => {
      const cache = await CreateLoadedCache([Music("a")])
      firestore.GetMusicListWithId.mockClear()

      expect(await cache.UpdateCache()).toBeNull()
      expect(firestore.GetMusicListWithId).not.toHaveBeenCalled()
    })

    it("throws when the music index is missing on the server", async () => {
      const cache = await CreateLoadedCache([Music("a")])
      firestore.GetUpdate.mockResolvedValue(null)

      await expect(cache.UpdateCache()).rejects.toThrow("The music index is missing")
      expect(Ids(cache.musics)).toEqual(["artist-a"])
    })
  })

  describe("reading", () => {
    it("removes a corrupted music from the cache and the registry, and still starts", async () => {
      await CreateLoadedCache([Music("a"), Music("b")])
      localStorage.setItem("MUSIC_artist-b", "{corrupted")

      const cache = CreateCache()

      expect(Ids(cache.musics)).toEqual(["artist-a"])
      expect(console.error).toHaveBeenCalled()
      expect(localStorage.getItem("MUSIC_artist-b")).toBeNull()
      expect(Ids(CreateCache().musics)).toEqual(["artist-a"])
    })

    it("fetches the catalog changes when a music is missing", async () => {
      const server = [Music("a")]
      const cache = await CreateLoadedCache(server)
      server.push(Music("b"))
      firestore.GetUpdate.mockResolvedValue({ ...NO_UPDATE, newMusicIds: ["artist-b"] })

      expect((await cache.GetMusicWithCheck("artist-b"))?.id).toBe("artist-b")
    })

    it("leaves the musics edited locally out of the remote musics", async () => {
      const cache = await CreateLoadedCache([Music("a"), Music("b")])
      localRegistry.add("artist-a")

      expect(Ids(cache.allRemoteMusics)).toEqual(["artist-b"])
    })

    it("refreshes one music, at its place", async () => {
      const server = [Music("a"), Music("b")]
      const cache = await CreateLoadedCache(server)
      server[0].genre = "rock"

      await cache.UpdateCacheMusic("artist-a")

      expect(Ids(cache.musics)).toEqual(["artist-a", "artist-b"])
      expect(CreateCache().GetMusic("artist-a")?.genre).toBe("rock")
    })

    it("empties the cache, and loads the whole catalog again after a reload", async () => {
      const cache = await CreateLoadedCache([Music("a")])

      cache.ClearCache()

      expect(localStorage.getItem("MUSIC_artist-a")).toBeNull()
      const reloaded = CreateCache()
      expect(reloaded.musics).toEqual([])
      await reloaded.UpdateCache()
      expect(firestore.GetAllMusics).toHaveBeenCalledTimes(2)
      expect(Ids(reloaded.musics)).toEqual(["artist-a"])
    })
  })

  describe("musics", () => {
    it("adds a created music, without its charts", async () => {
      const cache = await CreateLoadedCache([Music("a")])

      await cache.CreateMusicInBase(Music("b", Chart("x")))

      expect(Ids(cache.musics)).toEqual(["artist-a", "artist-b"])
      expect(CreateCache().GetMusic("artist-b")?.noteData).toEqual([])
    })

    it("keeps an updated music at its place", async () => {
      const cache = await CreateLoadedCache([Music("a"), Music("b"), Music("c")])
      const updated = Music("a")
      updated.genre = "rock"

      await cache.UpdateMusicInBase(updated)

      for (const musics of [cache.musics, CreateCache().musics]) {
        expect(Ids(musics)).toEqual(["artist-a", "artist-b", "artist-c"])
        expect(musics[0].genre).toBe("rock")
      }
    })

    it("removes a deleted music", async () => {
      const cache = await CreateLoadedCache([Music("a"), Music("b")])

      await cache.DeleteMusicInBase("artist-a")

      expect(Ids(cache.musics)).toEqual(["artist-b"])
      expect(Ids(CreateCache().musics)).toEqual(["artist-b"])
    })
  })

  describe("charts", () => {
    it("replaces a re-uploaded chart instead of duplicating it", async () => {
      const cache = await CreateLoadedCache([Music("a", Chart("x", 5))])

      await cache.UploadNotesInBase("artist-a", [Chart("x", 9)])

      for (const music of [cache.GetMusic("artist-a"), CreateCache().GetMusic("artist-a")]) {
        expect(music?.noteData.map(chart => [chart.chartName, chart.meter])).toEqual([["x", 9]])
      }
    })

    it("adds a new chart", async () => {
      const cache = await CreateLoadedCache([Music("a", Chart("x"))])

      await cache.UploadNotesInBase("artist-a", [Chart("y")])

      expect(CreateCache().GetMusic("artist-a")?.noteData.map(chart => chart.chartName)).toEqual(["x", "y"])
    })

    it("removes a deleted chart", async () => {
      const cache = await CreateLoadedCache([Music("a", Chart("x"), Chart("y"))])

      await cache.DeleteNoteInBase("artist-a", Chart("x"))

      expect(CreateCache().GetMusic("artist-a")?.noteData.map(chart => chart.chartName)).toEqual(["y"])
    })
  })

  describe("failed writes", () => {
    it("resyncs the cache, leaves it unchanged and throws the error", async () => {
      const cache = await CreateLoadedCache([Music("a", Chart("x"))])
      firestore.UploadNotes.mockRejectedValue(new Error("offline"))
      firestore.GetUpdate.mockClear()

      await expect(cache.UploadNotesInBase("artist-a", [Chart("y")])).rejects.toThrow("offline")

      expect(firestore.GetUpdate).toHaveBeenCalledTimes(1)
      expect(CreateCache().GetMusic("artist-a")?.noteData.map(chart => chart.chartName)).toEqual(["x"])
    })

    it("throws the write error, not the resync one", async () => {
      const cache = await CreateLoadedCache([Music("a")])
      firestore.DeleteMusic.mockRejectedValue(new Error("refused"))
      firestore.GetUpdate.mockRejectedValue(new Error("resync failed"))

      await expect(cache.DeleteMusicInBase("artist-a")).rejects.toThrow("refused")
      expect(Ids(cache.musics)).toEqual(["artist-a"])
    })
  })
})
