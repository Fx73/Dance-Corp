import { ALICE, BOB, Db, Seed, UseRulesTestEnvironment } from "./environment"
import { FieldPath, collectionGroup, deleteDoc, deleteField, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch } from "firebase/firestore"
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing"
import { beforeEach, describe, it } from "vitest"

const MUSIC = "musics/artist-title"
const MUSIC_DATA = { title: "Title", artist: "Artist", offset: 0, music: "song.ogg", stops: [], bpms: [{ time: 0, value: 120 }], genre: "pop" }

function NotePath(chartName: string): string {
  return `${MUSIC}/notes/${chartName}`
}

function Chart(chartName: string, creatorId: string): object {
  return { chartName, creatorId, meter: 5 }
}

describe("musics", () => {
  const Environment = UseRulesTestEnvironment()

  describe("read", () => {
    it("is open to visitors", async () => {
      await Seed(Environment(), { [MUSIC]: MUSIC_DATA })
      await assertSucceeds(getDoc(doc(Db(Environment()), MUSIC)))
    })
  })

  describe("create", () => {
    it("is allowed to a signed-in user", async () => {
      await assertSucceeds(setDoc(doc(Db(Environment(), ALICE), MUSIC), MUSIC_DATA))
    })

    it("is denied to a visitor", async () => {
      await assertFails(setDoc(doc(Db(Environment()), MUSIC), MUSIC_DATA))
    })

    it("is denied with a chart index", async () => {
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC), { ...MUSIC_DATA, charts: { chart: ALICE } }))
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC), { ...MUSIC_DATA, lastChartChange: "chart" }))
    })
  })

  describe("update", () => {
    it("allows any signed-in user to edit the unprotected fields", async () => {
      await Seed(Environment(), { [MUSIC]: MUSIC_DATA })
      await assertSucceeds(updateDoc(doc(Db(Environment(), BOB), MUSIC), { genre: "rock" }))
    })

    it("is denied to a visitor", async () => {
      await Seed(Environment(), { [MUSIC]: MUSIC_DATA })
      await assertFails(updateDoc(doc(Db(Environment()), MUSIC), { genre: "rock" }))
    })

    it("denies a change of the protected fields", async () => {
      await Seed(Environment(), { [MUSIC]: MUSIC_DATA })
      for (const change of [{ title: "Other" }, { artist: "Other" }, { offset: 1 }, { music: "other.ogg" }, { stops: [{ time: 4, value: 1 }] }]) {
        await assertFails(updateDoc(doc(Db(Environment(), ALICE), MUSIC), change))
      }
    })

    it("allows a change of the bpms while the music has no chart", async () => {
      await Seed(Environment(), { [MUSIC]: MUSIC_DATA })
      await assertSucceeds(updateDoc(doc(Db(Environment(), ALICE), MUSIC), { bpms: [{ time: 0, value: 140 }] }))
    })

    it("denies a change of the bpms once the music has charts", async () => {
      await Seed(Environment(), { [MUSIC]: { ...MUSIC_DATA, charts: { chart: BOB } }, [NotePath("chart")]: Chart("chart", BOB) })
      await assertFails(updateDoc(doc(Db(Environment(), ALICE), MUSIC), { bpms: [{ time: 0, value: 140 }] }))
    })
  })

  describe("delete", () => {
    it("is allowed once the music has no chart", async () => {
      await Seed(Environment(), { [MUSIC]: { ...MUSIC_DATA, charts: {} } })
      await assertSucceeds(deleteDoc(doc(Db(Environment(), ALICE), MUSIC)))
    })

    it("is denied while the music has charts", async () => {
      await Seed(Environment(), { [MUSIC]: { ...MUSIC_DATA, charts: { chart: ALICE } }, [NotePath("chart")]: Chart("chart", ALICE) })
      await assertFails(deleteDoc(doc(Db(Environment(), ALICE), MUSIC)))
    })

    it("is denied to a visitor", async () => {
      await Seed(Environment(), { [MUSIC]: MUSIC_DATA })
      await assertFails(deleteDoc(doc(Db(Environment()), MUSIC)))
    })
  })
})

// Same writes as MusicFirestoreService.UploadNotes and DeleteNotes
describe("charts", () => {
  const Environment = UseRulesTestEnvironment()

  function CreateChartBatch(uid: string, chartName: string, chart: object = Chart(chartName, uid), indexedName: string = chartName, indexedUid: string = uid) {
    const db = Db(Environment(), uid)
    const batch = writeBatch(db)
    batch.set(doc(db, NotePath(chartName)), chart)
    batch.update(doc(db, MUSIC), new FieldPath("charts", indexedName), indexedUid, "lastChartChange", indexedName)
    return batch
  }

  function DeleteChartBatch(uid: string, chartName: string) {
    const db = Db(Environment(), uid)
    const batch = writeBatch(db)
    batch.delete(doc(db, NotePath(chartName)))
    batch.update(doc(db, MUSIC), new FieldPath("charts", chartName), deleteField(), "lastChartChange", chartName)
    return batch
  }

  describe("read", () => {
    it("is open to visitors, including the query over every chart", async () => {
      await Seed(Environment(), { [MUSIC]: { ...MUSIC_DATA, charts: { chart: ALICE } }, [NotePath("chart")]: Chart("chart", ALICE) })
      await assertSucceeds(getDoc(doc(Db(Environment()), NotePath("chart"))))
      await assertSucceeds(getDocs(collectionGroup(Db(Environment()), "notes")))
    })
  })

  describe("create", () => {
    beforeEach(async () => {
      await Seed(Environment(), { [MUSIC]: { ...MUSIC_DATA, charts: { other: BOB } }, [NotePath("other")]: Chart("other", BOB) })
    })

    it("is allowed with its chart index entry, in one batch", async () => {
      await assertSucceeds(CreateChartBatch(ALICE, "chart").commit())
    })

    it("is denied without its chart index entry", async () => {
      await assertFails(setDoc(doc(Db(Environment(), ALICE), NotePath("chart")), Chart("chart", ALICE)))
    })

    it("is denied for another creator", async () => {
      await assertFails(CreateChartBatch(ALICE, "chart", Chart("chart", BOB)).commit())
    })

    it("is denied when the index names another creator", async () => {
      await assertFails(CreateChartBatch(ALICE, "chart", Chart("chart", ALICE), "chart", BOB).commit())
    })

    it("is denied when its name differs from its document", async () => {
      await assertFails(CreateChartBatch(ALICE, "chart", Chart("renamed", ALICE)).commit())
    })

    it("is denied when the index adds another chart", async () => {
      await assertFails(CreateChartBatch(ALICE, "chart", Chart("chart", ALICE), "ghost").commit())
    })

    it("denies an index entry without its chart", async () => {
      await assertFails(updateDoc(doc(Db(Environment(), ALICE), MUSIC), new FieldPath("charts", "ghost"), ALICE, "lastChartChange", "ghost"))
    })

    it("denies an index change on two charts at once", async () => {
      const db = Db(Environment(), ALICE)
      const batch = writeBatch(db)
      batch.set(doc(db, NotePath("chart")), Chart("chart", ALICE))
      batch.update(doc(db, MUSIC), { charts: { other: BOB, chart: ALICE, ghost: ALICE }, lastChartChange: "chart" })
      await assertFails(batch.commit())
    })

    it("is denied to a visitor", async () => {
      await assertFails(setDoc(doc(Db(Environment()), NotePath("chart")), Chart("chart", ALICE)))
    })
  })

  describe("update", () => {
    beforeEach(async () => {
      await Seed(Environment(), { [MUSIC]: { ...MUSIC_DATA, charts: { chart: ALICE } }, [NotePath("chart")]: Chart("chart", ALICE) })
    })

    it("is allowed to its creator", async () => {
      await assertSucceeds(setDoc(doc(Db(Environment(), ALICE), NotePath("chart")), { ...Chart("chart", ALICE), meter: 6 }))
    })

    it("is denied to another user", async () => {
      await assertFails(setDoc(doc(Db(Environment(), BOB), NotePath("chart")), { ...Chart("chart", ALICE), meter: 6 }))
    })

    it("denies a change of creator or name", async () => {
      await assertFails(setDoc(doc(Db(Environment(), ALICE), NotePath("chart")), Chart("chart", BOB)))
      await assertFails(setDoc(doc(Db(Environment(), ALICE), NotePath("chart")), Chart("renamed", ALICE)))
    })
  })

  describe("delete", () => {
    beforeEach(async () => {
      await Seed(Environment(), { [MUSIC]: { ...MUSIC_DATA, charts: { chart: ALICE } }, [NotePath("chart")]: Chart("chart", ALICE) })
    })

    it("is allowed to its creator, with its chart index entry, in one batch", async () => {
      await assertSucceeds(DeleteChartBatch(ALICE, "chart").commit())
    })

    it("is denied without removing its chart index entry", async () => {
      await assertFails(deleteDoc(doc(Db(Environment(), ALICE), NotePath("chart"))))
    })

    it("is denied to another user", async () => {
      await assertFails(DeleteChartBatch(BOB, "chart").commit())
    })

    it("denies removing an index entry while its chart remains", async () => {
      await assertFails(updateDoc(doc(Db(Environment(), ALICE), MUSIC), new FieldPath("charts", "chart"), deleteField(), "lastChartChange", "chart"))
    })
  })
})
