import { ALICE, Db, Seed, UseRulesTestEnvironment } from "./environment"
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing"
import { describe, it } from "vitest"
import { doc, getDoc, setDoc } from "firebase/firestore"

const MUSIC_DATA = "metadata/musicdata"
const MUSIC_INDEX = "metadata/music_index"
const MUSIC_UPDATES = "metadata/music_updates"

describe("metadata", () => {
  const Environment = UseRulesTestEnvironment()

  it("is open to visitors for reading", async () => {
    await Seed(Environment(), { [MUSIC_INDEX]: { ids: [], updatedAt: 0 } })
    await assertSucceeds(getDoc(doc(Db(Environment()), MUSIC_INDEX)))
  })

  it("denies writing an unknown document", async () => {
    await assertFails(setDoc(doc(Db(Environment(), ALICE), "metadata/other"), { value: 1 }))
  })

  describe("musicdata (genres)", () => {
    it("allows a signed-in user to write the genre list", async () => {
      await assertSucceeds(setDoc(doc(Db(Environment(), ALICE), MUSIC_DATA), { genres: ["pop", "rock"] }))
    })

    it("denies another field or another type", async () => {
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC_DATA), { genres: ["pop"], other: 1 }))
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC_DATA), { genres: "pop" }))
    })

    it("denies a visitor", async () => {
      await assertFails(setDoc(doc(Db(Environment()), MUSIC_DATA), { genres: ["pop"] }))
    })
  })

  describe("music_index", () => {
    it("allows its creation", async () => {
      await assertSucceeds(setDoc(doc(Db(Environment(), ALICE), MUSIC_INDEX), { ids: ["a", "b"], updatedAt: 1 }))
    })

    it("denies an invalid index", async () => {
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC_INDEX), { ids: ["a"], updatedAt: 1, other: 1 }))
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC_INDEX), { ids: "a", updatedAt: 1 }))
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC_INDEX), { ids: ["a"], updatedAt: "now" }))
    })

    it("allows adding or removing one id", async () => {
      await Seed(Environment(), { [MUSIC_INDEX]: { ids: ["a", "b"], updatedAt: 1 } })
      await assertSucceeds(setDoc(doc(Db(Environment(), ALICE), MUSIC_INDEX), { ids: ["a", "b", "c"], updatedAt: 2 }))
      await assertSucceeds(setDoc(doc(Db(Environment(), ALICE), MUSIC_INDEX), { ids: ["a", "b"], updatedAt: 3 }))
    })

    it("denies adding or removing several ids at once", async () => {
      await Seed(Environment(), { [MUSIC_INDEX]: { ids: ["a", "b", "c"], updatedAt: 1 } })
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC_INDEX), { ids: ["a"], updatedAt: 2 }))
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC_INDEX), { ids: [], updatedAt: 2 }))
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC_INDEX), { ids: ["a", "b", "c", "d", "e"], updatedAt: 2 }))
    })

    it("denies a visitor", async () => {
      await assertFails(setDoc(doc(Db(Environment()), MUSIC_INDEX), { ids: [], updatedAt: 1 }))
    })
  })

  describe("music_updates", () => {
    it("allows touching one music per write", async () => {
      await assertSucceeds(setDoc(doc(Db(Environment(), ALICE), MUSIC_UPDATES), { a: 1 }, { merge: true }))
      await assertSucceeds(setDoc(doc(Db(Environment(), ALICE), MUSIC_UPDATES), { b: 2 }, { merge: true }))
      await assertSucceeds(setDoc(doc(Db(Environment(), ALICE), MUSIC_UPDATES), { a: 3 }, { merge: true }))
    })

    it("denies touching several musics at once", async () => {
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC_UPDATES), { a: 1, b: 1 }))
      await Seed(Environment(), { [MUSIC_UPDATES]: { a: 1 } })
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC_UPDATES), { b: 2, c: 2 }, { merge: true }))
    })

    it("denies removing a music", async () => {
      await Seed(Environment(), { [MUSIC_UPDATES]: { a: 1, b: 1 } })
      await assertFails(setDoc(doc(Db(Environment(), ALICE), MUSIC_UPDATES), { a: 2 }))
    })

    it("denies a visitor", async () => {
      await assertFails(setDoc(doc(Db(Environment()), MUSIC_UPDATES), { a: 1 }, { merge: true }))
    })
  })
})
