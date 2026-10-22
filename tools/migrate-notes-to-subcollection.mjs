// Moves the charts embedded in musics/{id}.noteData to musics/{id}/notes/{chartName}
// and builds the chart index musics/{id}.charts = { [chartName]: creatorId }.
//
// Two steps, so that the deployed app keeps working during the migration:
//   1. default:   writes the notes subcollections and the chart index, keeps noteData.
//                 Also removes the legacy notes documents that are not in noteData.
//   2. --cleanup: once the new app is deployed, removes noteData from every music
//                 whose subcollection matches its chart index.
// Idempotent: each step can be run again.
//
// Setup (once): gcloud auth application-default login
//               cd tools && npm install
// Usage:        node migrate-notes-to-subcollection.mjs --project dev            dry run
//               node migrate-notes-to-subcollection.mjs --project dev --apply
//               node migrate-notes-to-subcollection.mjs --project dev --cleanup --apply

import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { applicationDefault, initializeApp } from 'firebase-admin/app'

const PROJECTS = { dev: 'dance-corp-dev', prod: 'dance-corp' }
const projectArg = process.argv[process.argv.indexOf('--project') + 1]
const APPLY = process.argv.includes('--apply')
const CLEANUP = process.argv.includes('--cleanup')

if (!process.argv.includes('--project') || !PROJECTS[projectArg]) {
  console.error('Missing --project dev|prod')
  process.exit(1)
}

const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId: PROJECTS[projectArg] }))
const writer = APPLY ? db.bulkWriter() : null
const stats = { musics: 0, chartsWritten: 0, legacyDeleted: 0, noteDataRemoved: 0, skipped: [] }

console.log(`${PROJECTS[projectArg]}: ${CLEANUP ? 'cleanup' : 'migration'}${APPLY ? '' : ' (dry run)'}`)

for (const musicDoc of (await db.collection('musics').get()).docs) {
  stats.musics++
  const noteData = musicDoc.get('noteData')
  const notesSnap = await musicDoc.ref.collection('notes').get()
  const subcollectionNames = notesSnap.docs.map(d => d.id).sort()

  if (CLEANUP) {
    if (noteData === undefined) continue
    const indexNames = Object.keys(musicDoc.get('charts') ?? {}).sort()
    const embeddedNames = noteData.map(n => n.chartName).sort()
    if (JSON.stringify(indexNames) !== JSON.stringify(subcollectionNames) || JSON.stringify(embeddedNames) !== JSON.stringify(subcollectionNames)) {
      stats.skipped.push(`${musicDoc.id}: index [${indexNames}], subcollection [${subcollectionNames}], noteData [${embeddedNames}]`)
      continue
    }
    writer?.update(musicDoc.ref, { noteData: FieldValue.delete() })
    stats.noteDataRemoved++
    continue
  }

  // Already migrated, and noteData removed
  if (noteData === undefined) continue

  const charts = {}
  for (const note of noteData) {
    if (!note.chartName || !note.creatorId) {
      stats.skipped.push(`${musicDoc.id}: chart without chartName or creatorId`)
      continue
    }
    charts[note.chartName] = note.creatorId
    writer?.set(musicDoc.ref.collection('notes').doc(note.chartName), note)
    stats.chartsWritten++
  }

  // Legacy documents from the old subcollection model, not in noteData anymore
  for (const name of subcollectionNames) {
    if (name in charts) continue
    writer?.delete(musicDoc.ref.collection('notes').doc(name))
    stats.legacyDeleted++
  }

  writer?.update(musicDoc.ref, { charts })
}

await writer?.close()
console.log(stats)
if (!APPLY) console.log('Dry run, nothing written. Pass --apply to write.')
