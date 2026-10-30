import { Firestore, doc, setDoc } from "firebase/firestore"
import { RulesTestContext, RulesTestEnvironment, initializeTestEnvironment } from "@firebase/rules-unit-testing"
import { afterAll, afterEach, beforeAll } from "vitest"

import { join } from "node:path"
import { readFileSync } from "node:fs"

// A demo- project never reaches a real Firebase project
const PROJECT_ID = "demo-dance-corp"
const RULES_PATH = join(process.cwd(), "website", "firestore.rules")

export const ALICE = "alice"
export const BOB = "bob"

/** Starts a rules test environment for the file, with an empty database before each test */
export function UseRulesTestEnvironment(): () => RulesTestEnvironment {
  let environment: RulesTestEnvironment | undefined

  beforeAll(async () => {
    // Emulator host and port come from FIRESTORE_EMULATOR_HOST, set by `firebase emulators:exec`
    environment = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules: readFileSync(RULES_PATH, "utf8") },
    })
  })

  afterEach(async () => {
    await environment?.clearFirestore()
  })

  afterAll(async () => {
    await environment?.cleanup()
  })

  return () => {
    if (!environment) throw new Error("The rules test environment is not started")
    return environment
  }
}

/** Database seen by a signed-in user, or by a visitor without uid */
export function Db(environment: RulesTestEnvironment, uid?: string): Firestore {
  const context: RulesTestContext = uid ? environment.authenticatedContext(uid) : environment.unauthenticatedContext()
  // The modular API accepts the compat instance returned by the test context
  return context.firestore() as unknown as Firestore
}

/** Writes documents without checking the rules */
export async function Seed(environment: RulesTestEnvironment, documents: Record<string, object>): Promise<void> {
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore() as unknown as Firestore
    for (const [path, data] of Object.entries(documents)) {
      await setDoc(doc(db, path), data)
    }
  })
}
