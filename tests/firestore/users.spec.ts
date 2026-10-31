import { ALICE, BOB, Db, Seed, UseRulesTestEnvironment } from "./environment"
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing"
import { describe, it } from "vitest"
import { doc, getDoc, setDoc } from "firebase/firestore"

describe("users", () => {
  const Environment = UseRulesTestEnvironment()

  it("allows a user to read and write their document and its subcollections", async () => {
    await assertSucceeds(setDoc(doc(Db(Environment(), ALICE), `users/${ALICE}`), { name: "Alice" }))
    await assertSucceeds(getDoc(doc(Db(Environment(), ALICE), `users/${ALICE}`)))
    await assertSucceeds(setDoc(doc(Db(Environment(), ALICE), `users/${ALICE}/musics/music`), { score: 1 }))
  })

  it("denies another user", async () => {
    await Seed(Environment(), { [`users/${ALICE}`]: { name: "Alice" } })
    await assertFails(getDoc(doc(Db(Environment(), BOB), `users/${ALICE}`)))
    await assertFails(setDoc(doc(Db(Environment(), BOB), `users/${ALICE}/musics/music`), { score: 1 }))
  })

  it("denies a visitor", async () => {
    await Seed(Environment(), { [`users/${ALICE}`]: { name: "Alice" } })
    await assertFails(getDoc(doc(Db(Environment()), `users/${ALICE}`)))
  })
})
