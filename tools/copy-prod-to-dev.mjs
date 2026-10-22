// Copies the public catalog (musics with their notes subcollections, and metadata) from the prod Firestore to the dev one.
// Prod is only read. Dev documents with the same path are overwritten, other musics are kept,
// and dev charts that do not exist in prod are deleted so that each music matches its chart index.
// users is not copied (personal data, and its uids do not exist in dev Authentication).
//
// Setup (once): gcloud auth application-default login
//               cd tools && npm install
// Usage:        node copy-prod-to-dev.mjs           dry run, counts only
//               node copy-prod-to-dev.mjs --apply   copy

import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const APPLY = process.argv.includes('--apply')
const COLLECTIONS = ['musics', 'metadata']
const NOTES_COLLECTION = 'notes'

const prod = getFirestore(initializeApp({ credential: applicationDefault(), projectId: 'dance-corp' }, 'prod'))
const dev = getFirestore(initializeApp({ credential: applicationDefault(), projectId: 'dance-corp-dev' }, 'dev'))

async function CountDev() {
  const counts = await Promise.all(COLLECTIONS.map(async c => `${c}=${(await dev.collection(c).count().get()).data().count}`))
  const notes = (await dev.collectionGroup(NOTES_COLLECTION).count().get()).data().count
  return `${counts.join(', ')}, ${NOTES_COLLECTION}=${notes}`
}

// 1) Read prod
const snapshots = []
let bytes = 0
for (const name of [...COLLECTIONS, NOTES_COLLECTION]) {
  const snap = name === NOTES_COLLECTION ? await prod.collectionGroup(name).get() : await prod.collection(name).get()
  for (const d of snap.docs) bytes += Buffer.byteLength(JSON.stringify(d.data()))
  snapshots.push(snap)
  console.log(`prod ${name}: ${snap.size} docs`)
}
console.log(`total: ~${(bytes / 1024 / 1024).toFixed(1)} MB`)

const [musicSnap, , notesSnap] = snapshots
if (musicSnap.docs.some(d => d.get('charts') === undefined)) {
  console.error('Prod is not migrated to the notes subcollection yet: run migrate-notes-to-subcollection.mjs --project prod first.')
  process.exit(1)
}

const prodNotePaths = new Set(notesSnap.docs.map(d => d.ref.path))
const copiedMusicIds = new Set(musicSnap.docs.map(d => d.id))
const devNotesSnap = await dev.collectionGroup(NOTES_COLLECTION).get()
const staleDevNotes = devNotesSnap.docs.filter(d => copiedMusicIds.has(d.ref.parent.parent.id) && !prodNotePaths.has(d.ref.path))
console.log(`dev before: ${await CountDev()}, ${staleDevNotes.length} dev-only charts to delete`)

if (!APPLY) {
  console.log('Dry run, nothing written. Pass --apply to copy.')
  process.exit(0)
}

// 2) Write dev
const writer = dev.bulkWriter()
for (const snap of snapshots) {
  for (const d of snap.docs) writer.set(dev.doc(d.ref.path), d.data())
}
for (const d of staleDevNotes) writer.delete(d.ref)
await writer.close()
console.log(`dev after: ${await CountDev()}`)
