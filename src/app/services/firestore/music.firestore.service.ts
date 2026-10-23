import { DocumentData, DocumentSnapshot, FieldPath, Firestore, QueryDocumentSnapshot, collection, collectionGroup, deleteDoc, deleteField, doc, documentId, getDoc, getDocs, getFirestore, orderBy, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
import { MusicDto, NoteDataDto } from '../../game/game-model/music.dto'

import { Injectable, inject } from '@angular/core'
import { AppComponent } from 'src/app/app.component'
import { DifficultyCriteria } from 'src/app/pages/upload/DifficultyCriteria'
import { DeepEqual } from 'src/app/shared/utils/object-extend'
import { FirestoreConverter } from './firestore.converter'
import { UserFirestoreService } from './user.firestore.service'

@Injectable({
    providedIn: 'root'
})
export class MusicFirestoreService {
    //#region Constants
    readonly MUSIC_COLLECTION = "musics"
    readonly NOTES_COLLECTION = "notes"
    readonly METADATA_COLLECTION = "metadata"
    readonly MUSIC_METADATA_DOC = "musicdata"
    readonly MUSIC_INDEX_DOC = "music_index"
    readonly MUSIC_UPDATES_DOC = "music_updates"

    readonly firestoreConverterMusic: FirestoreConverter<MusicDto> = new FirestoreConverter(MusicDto, { noteData: NoteDataDto, difficultyCriterias: DifficultyCriteria })
    readonly firestoreConverterNote: FirestoreConverter<NoteDataDto> = new FirestoreConverter(NoteDataDto, { difficultyCriterias: DifficultyCriteria })

    // Keep in sync with protectedFields() in website/firestore.rules
    readonly protectedFields: (keyof MusicDto)[] = ['artist', 'title', 'offset', 'music', 'stops']
    readonly notesProtectedFields: (keyof MusicDto)[] = ['bpms']

    //#endregion

    private userFirestoreService = inject(UserFirestoreService)

    db: Firestore

    constructor() {
        this.db = getFirestore()
    }

    async UploadMusic(dto: MusicDto): Promise<void> {
        try {
            if (!this.userFirestoreService.user) throw new Error("User not authenticated")

            const musicRef = doc(this.db, this.MUSIC_COLLECTION, dto.id).withConverter(this.firestoreConverterMusic)

            const { noteData: notes, ...mainData } = dto
            await setDoc(musicRef, mainData)

            this.AddGenres(dto.genre ?? "")

            this.UpdateMusicIndex(dto.id, false)
            AppComponent.PresentOkToast("Music successfully uploaded to firebase!")
        } catch (error) {
            AppComponent.PresentWarningToast("Error uploading music: " + error)
            throw error
        }
    }

    async UpdateMusic(dto: MusicDto): Promise<void> {
        try {
            if (!this.userFirestoreService.user) throw new Error("User not authenticated")

            const musicRef = doc(this.db, this.MUSIC_COLLECTION, dto.id).withConverter(this.firestoreConverterMusic)

            // check protected fields are not modified
            const snap = await getDoc(musicRef)
            const current = snap.data()
            if (!current) throw new Error("Music not found")
            for (const field of this.GetProtectedFields(this.ChartCount(snap))) {
                if (!DeepEqual(dto[field], current[field]))
                    throw new Error(`Field "${field}" cannot be modified after upload.`)
            }

            const { noteData: notes, ...mainData } = dto
            await updateDoc(musicRef, mainData)

            this.AddGenres(dto.genre ?? "")

            this.UpdateMusicIndex(dto.id)
            AppComponent.PresentOkToast("Music successfully updated to firebase!")
        } catch (error) {
            AppComponent.PresentWarningToast("Error updating music: " + error)
            throw error
        }
    }

    /** Fields that cannot change once uploaded; bpms are also locked as soon as the music has charts */
    GetProtectedFields(chartCount: number): (keyof MusicDto)[] {
        return chartCount > 0
            ? [...this.protectedFields, ...this.notesProtectedFields]
            : this.protectedFields
    }

    async UploadNotes(musicId: string, notes: NoteDataDto[]): Promise<void> {
        try {
            const user = this.userFirestoreService.user
            if (!user) throw new Error("User not authenticated")

            const musicRef = doc(this.db, this.MUSIC_COLLECTION, musicId)

            const snap = await getDoc(musicRef)
            if (!snap.exists()) throw new Error("Music not found")

            const charts: Record<string, string> = snap.get('charts') ?? {}

            for (const note of notes) {
                // Only allow updates if the user is the creator OR it's a new note
                if (!note.creatorId) {
                    note.creatorId = user.id
                    note.credit = note.credit ?? user.name
                }

                const isExisting = note.chartName in charts
                if (note.creatorId !== user.id || (isExisting && charts[note.chartName] !== user.id)) {
                    console.log(`Skipping update for note ${note.chartName} - Not the creator`)
                    continue
                }

                const noteRef = doc(musicRef, this.NOTES_COLLECTION, note.chartName).withConverter(this.firestoreConverterNote)

                // Existing chart: only its document changes
                if (isExisting) {
                    await setDoc(noteRef, note)
                    continue
                }

                // New chart: written in one batch with its chart index entry (checked by the rules)
                const batch = writeBatch(this.db)
                batch.set(noteRef, note)
                batch.update(musicRef, new FieldPath('charts', note.chartName), user.id, 'lastChartChange', note.chartName)
                await batch.commit()
                charts[note.chartName] = user.id
            }

            this.UpdateMusicIndex(musicId)

        } catch (error) {
            AppComponent.PresentWarningToast("Error updating music: " + error)
            throw error
        }
    }

    async GetAllMusics(): Promise<MusicDto[]> {
        console.log("Querying complete database for music list. This should only happen once per session and will be cached for next calls.")

        const musicRef = collection(this.db, this.MUSIC_COLLECTION).withConverter(this.firestoreConverterMusic)
        const notesRef = collectionGroup(this.db, this.NOTES_COLLECTION).withConverter(this.firestoreConverterNote)
        const [musicSnapshot, notesSnapshot] = await Promise.all([getDocs(query(musicRef, orderBy(documentId()))), getDocs(notesRef)])

        if (musicSnapshot.empty)
            throw new Error("No musics to fetch in database")

        // Group the charts by music; charts whose music no longer exists are ignored
        const notesByMusic: Map<string, NoteDataDto[]> = new Map()
        notesSnapshot.forEach(noteDoc => {
            const musicId = noteDoc.ref.parent.parent?.id
            if (!musicId) return
            notesByMusic.set(musicId, [...(notesByMusic.get(musicId) ?? []), noteDoc.data()])
        })

        const musics = musicSnapshot.docs.map(musicDoc => this.ToMusic(musicDoc, notesByMusic.get(musicDoc.id) ?? []))

        console.log("Musics retrieved count:", musics.length, "charts:", notesSnapshot.size)
        return musics
    }

    async GetMusicListWithId(ids: string[]): Promise<MusicDto[]> {
        if (ids.length === 0) return []

        const musicRef = collection(this.db, this.MUSIC_COLLECTION)
            .withConverter(this.firestoreConverterMusic)

        const chunks: string[][] = []
        for (let i = 0; i < ids.length; i += 30) {
            chunks.push(ids.slice(i, i + 30))
        }

        const results: MusicDto[] = []

        for (const chunk of chunks) {
            const q = query(
                musicRef,
                where(documentId(), "in", chunk)
            )

            const snap = await getDocs(q)
            const musics = await Promise.all(snap.docs.map(async musicDoc => this.ToMusic(musicDoc, await this.GetNotes(musicDoc.id))))
            results.push(...musics)
        }

        return results
    }

    async DeleteMusic(musicId: string): Promise<void> {
        try {
            const musicRef = doc(this.db, this.MUSIC_COLLECTION, musicId)

            const snap = await getDoc(musicRef)
            if (!snap.exists()) throw new Error("Music not found")

            // Check whether charts remain
            if (this.ChartCount(snap) > 0) {
                console.warn("Cannot delete, notes are still present on music:", musicId)
                throw new Error("Cannot delete music with existing notes")
            }

            await deleteDoc(musicRef)

            this.RemoveMusicFromIndex(musicId)
            AppComponent.PresentOkToast("Music successfully deleted from firebase !")

        } catch (error) {
            AppComponent.PresentErrorToast("Error deleting music: " + error)
            throw error
        }
    }

    async DeleteNote(musicId: string, note: NoteDataDto): Promise<void> {
        try {
            const userId = this.userFirestoreService.user?.id
            if (!userId) throw new Error("User not authenticated")

            const musicRef = doc(this.db, this.MUSIC_COLLECTION, musicId)
            const noteRef = doc(musicRef, this.NOTES_COLLECTION, note.chartName).withConverter(this.firestoreConverterNote)

            const snap = await getDoc(noteRef)
            if (!snap.exists()) throw new Error("Note not found")

            if (snap.data().creatorId !== userId)
                throw new Error("User is not the creator of this note")

            // The chart and its chart index entry are removed in one batch (checked by the rules)
            const batch = writeBatch(this.db)
            batch.delete(noteRef)
            batch.update(musicRef, new FieldPath('charts', note.chartName), deleteField(), 'lastChartChange', note.chartName)
            await batch.commit()

            // Flag the music as updated so that other clients drop the chart from their cache
            this.UpdateMusicIndex(musicId)

        } catch (error) {
            AppComponent.PresentWarningToast("Error deleting note: " + error)
            throw error
        }
    }

    private async GetNotes(musicId: string): Promise<NoteDataDto[]> {
        const notesRef = collection(this.db, this.MUSIC_COLLECTION, musicId, this.NOTES_COLLECTION).withConverter(this.firestoreConverterNote)
        const snap = await getDocs(notesRef)
        return snap.docs.map(noteDoc => noteDoc.data())
    }

    /** Builds a music from its document and its charts, read from the notes subcollection */
    private ToMusic(musicDoc: QueryDocumentSnapshot<MusicDto>, notes: NoteDataDto[]): MusicDto {
        const music = musicDoc.data()
        // Firestore-only fields, and the legacy embedded notes until they are removed
        Reflect.deleteProperty(music, 'charts')
        Reflect.deleteProperty(music, 'lastChartChange')
        music.noteData = notes.sort((a, b) => (a.meter || 0) - (b.meter || 0))
        return music
    }

    /** Number of charts of a music, from its chart index */
    private ChartCount<T, U extends DocumentData>(musicDoc: DocumentSnapshot<T, U>): number {
        return Object.keys(musicDoc.get('charts') ?? {}).length
    }

    //#region Genres

    async AddGenres(genres: string): Promise<void> {
        if (!genres || genres.trim().length === 0) return

        const normalized = genres.split(',').map(g => g.trim().toLowerCase()).filter(g => g.length > 0)
        if (normalized.length === 0) return

        const ref = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_METADATA_DOC)
        const snap = await getDoc(ref)

        const existing = snap.data()?.['genres'] ?? []

        if (normalized.every((g: string) => existing.includes(g))) {
            return
        }
        const merged = Array.from(new Set([...existing, ...normalized]))

        // setDoc creates the document on a fresh database
        await setDoc(ref, { genres: merged })
    }

    async GetGenres(): Promise<string[]> {
        const ref = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_METADATA_DOC)
        const snap = await getDoc(ref)

        if (!snap.exists()) {
            return []
        }

        const genres = snap.data()?.['genres'] ?? []

        return genres
            .filter((g: string) => g.length > 0)
            .map((g: string) => g.charAt(0).toUpperCase() + g.slice(1))
    }

    //#endregion

    //#region Updater Mechanism
    async InitMusicIndex(): Promise<void> {
        const musicRef = collection(this.db, this.MUSIC_COLLECTION)
        const snapshot = await getDocs(musicRef)

        const ids: string[] = []
        snapshot.forEach(doc => ids.push(doc.id))

        const indexRef = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_INDEX_DOC)

        await setDoc(indexRef, {
            ids,
            updatedAt: Date.now()
        })

        console.log("Music index initialized:", ids.length, "entries")
    }

    async GetUpdate(lastUpdateTimestamp: number, knownIds: Set<string>): Promise<{ newMusicIds: string[], toUpdateMusicIds: string[], toDeleteMusicIds: string[], updatedAt: number } | null> {
        // 1) Read the global timestamp of the last update and the list of all music ids
        const refIndex = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_INDEX_DOC)
        const snapIndex = await getDoc(refIndex)

        if (!snapIndex.exists())
            return null

        const indexData = snapIndex.data()
        const remoteIds: string[] = indexData['ids'] ?? []
        const remoteUpdatedAt: number = indexData['updatedAt'] ?? 0

        // 2) If the global timestamp hasn't changed → nothing to do
        if (remoteUpdatedAt <= lastUpdateTimestamp) {
            return { newMusicIds: [], toUpdateMusicIds: [], toDeleteMusicIds: [], updatedAt: remoteUpdatedAt }
        }

        // 3) Read the incremental updates
        const refUpdates = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_UPDATES_DOC)
        const snapUpdates = await getDoc(refUpdates)

        const updates: Record<string, number> = snapUpdates.exists() ? snapUpdates.data() : {}

        // 4) Determine the music tracks modified since the last timestamp
        const toUpdateMusicIds = Object.entries(updates).filter(([, ts]) => ts > lastUpdateTimestamp).map(([id]) => id)

        // 5) Find new musics and deleted musics by comparing the list of ids
        const newMusicIds = remoteIds.filter(id => !knownIds.has(id))
        const toDeleteMusicIds = Array.from(knownIds).filter(id => !remoteIds.includes(id))

        return {
            newMusicIds,
            toUpdateMusicIds,
            toDeleteMusicIds,
            updatedAt: remoteUpdatedAt
        }
    }

    async UpdateMusicIndex(musicId: string, isUpdate: boolean = true): Promise<void> {
        const indexRef = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_INDEX_DOC)
        const snap = await getDoc(indexRef)

        let ids: string[] = []

        if (snap.exists()) {
            ids = snap.data()['ids'] ?? []
        }

        if (!ids.includes(musicId)) {
            ids.push(musicId)
        }

        await setDoc(indexRef, {
            ids,
            updatedAt: Date.now()
        })

        if (!isUpdate) return

        const updatesRef = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_UPDATES_DOC)
        await setDoc(updatesRef, {
            [musicId]: Date.now()
        }, { merge: true })
    }

    async RemoveMusicFromIndex(musicId: string): Promise<void> {
        const indexRef = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_INDEX_DOC)
        const snap = await getDoc(indexRef)

        if (!snap.exists()) return

        let ids: string[] = snap.data()['ids'] ?? []
        ids = ids.filter(id => id !== musicId)

        await setDoc(indexRef, {
            ids,
            updatedAt: Date.now()
        })

        console.log("Music removed from index:", musicId)
    }

    //#endregion

}
