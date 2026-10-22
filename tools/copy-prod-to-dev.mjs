// Copies the public catalog (musics + metadata) from the prod Firestore to the dev one.
// Prod is only read. Dev documents with the same path are overwritten, others are kept.
// users is not copied (personal data, and its uids do not exist in dev Authentication).
// musics/{id}/notes subcollections are legacy data and are not copied either.
//
// Setup (once): gcloud auth application-default login
//               cd tools && npm install
// Usage:        node copy-prod-to-dev.mjs           dry run, counts only
//               node copy-prod-to-dev.mjs --apply   copy

import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const APPLY = process.argv.includes('--apply')
const COLLECTIONS = ['musics', 'metadata']

const prod = getFirestore(initializeApp({ credential: applicationDefault(), projectId: 'dance-corp' }, 'prod'))
const dev = getFirestore(initializeApp({ credential: applicationDefault(), projectId: 'dance-corp-dev' }, 'dev'))

async function CountDev() {
  const counts = await Promise.all(COLLECTIONS.map(async c => `${c}=${(await dev.collection(c).count().get()).data().count}`))
  return counts.join(', ')
}

// 1) Read prod
const snapshots = []
let bytes = 0
for (const name of COLLECTIONS) {
  const snap = await prod.collection(name).get()
  for (const d of snap.docs) bytes += Buffer.byteLength(JSON.stringify(d.data()))
  snapshots.push(snap)
  console.log(`prod ${name}: ${snap.size} docs`)
}
console.log(`total: ~${(bytes / 1024 / 1024).toFixed(1)} MB`)
console.log(`dev before: ${await CountDev()}`)

if (!APPLY) {
  console.log('Dry run, nothing written. Pass --apply to copy.')
  process.exit(0)
}

// 2) Write dev
const writer = dev.bulkWriter()
for (const snap of snapshots) {
  for (const d of snap.docs) writer.set(dev.doc(d.ref.path), d.data())
}
await writer.close()
console.log(`dev after: ${await CountDev()}`)
