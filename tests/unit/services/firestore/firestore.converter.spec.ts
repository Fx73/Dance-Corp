import { DocumentData, QueryDocumentSnapshot, Timestamp } from "firebase/firestore"
import { MusicDto, NoteDataDto } from "src/app/game/game-model/music.dto"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DifficultyCriteria } from "src/app/pages/upload/DifficultyCriteria"
import { FirestoreConverter } from "src/app/services/firestore/firestore.converter"
import { ReadChart } from "../../fixtures/fixtures"
import { SccReader } from "src/app/pages/upload/reader.ssc"

// A copy of the data as Firestore gives it back: dates read as Timestamp
function ToSnapshot(data: DocumentData): QueryDocumentSnapshot<DocumentData> {
  function ToStored(value: unknown): unknown {
    if (value instanceof Date) return Timestamp.fromDate(value)
    if (Array.isArray(value)) return value.map(ToStored)
    if (Object(value) === value) return Object.fromEntries(Object.entries(value as object).map(([key, v]) => [key, ToStored(v)]))
    return value
  }

  const stored = ToStored(data) as DocumentData
  return { data: () => stored } as QueryDocumentSnapshot<DocumentData>
}

describe("FirestoreConverter", () => {
  // Same converters as MusicFirestoreService
  const musicConverter = new FirestoreConverter(MusicDto, { noteData: NoteDataDto, difficultyCriterias: DifficultyCriteria })

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined)
  })

  describe("toFirestore", () => {
    it("drops the undefined fields and the additional fields", () => {
      const music = new MusicDto()
      music.title = "Title"
      music.additionalFields = { version: "1" }
      const data = musicConverter.toFirestore(music)
      expect(data).toHaveProperty("title", "Title")
      expect(data).not.toHaveProperty("artist")
      expect(data).not.toHaveProperty("additionalFields")
    })

    it("keeps the dates", () => {
      const chart = new NoteDataDto()
      const data = new FirestoreConverter(NoteDataDto).toFirestore(chart)
      expect(data["creationDate"]).toBe(chart.creationDate)
    })

    it("turns the nested arrays into objects, which Firestore cannot store", () => {
      const chart = new NoteDataDto({ notes: "1000\n0000" })
      const data = new FirestoreConverter(NoteDataDto).toFirestore(chart)
      expect(data["stepChart"][0].steps).toEqual([{ 0: 1, 1: 0, 2: 0, 3: 0 }, { 0: 0, 1: 0, 2: 0, 3: 0 }])
    })
  })

  describe("fromFirestore", () => {
    it("reads back the music written, with its nested instances", () => {
      const music = SccReader.ParseFile("two-charts.ssc", ReadChart("two-charts.ssc"))
      music.additionalFields = undefined

      const reread = musicConverter.fromFirestore(ToSnapshot(musicConverter.toFirestore(music)))

      expect(reread).toBeInstanceOf(MusicDto)
      expect(reread.noteData[0]).toBeInstanceOf(NoteDataDto)
      expect(reread.noteData[0].difficultyCriterias).toBeInstanceOf(DifficultyCriteria)
      expect(reread).toEqual(music)
    })

    it("turns the Timestamps into dates", () => {
      const date = new Date("2024-05-01T10:00:00Z")
      const chart = new FirestoreConverter(NoteDataDto).fromFirestore(ToSnapshot({ creationDate: date }))
      expect(chart.creationDate).toEqual(date)
    })
  })
})
