import { Firestore, addDoc, collection, deleteDoc, doc, documentId, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, startAfter, updateDoc, where } from 'firebase/firestore';
import { MusicDto, NoteDataDto } from '../../game/gameModel/music.dto';

import { AppComponent } from 'src/app/app.component';
import { DanceType } from 'src/app/game/constants/dance-type.enum';
import { DifficultyCriteria } from 'src/app/pages/upload/DifficultyCriteria';
import { FirestoreConverter } from './firestore.converter';
import { Injectable } from '@angular/core';
import { UserFirestoreService } from './user.firestore.service';

@Injectable({
    providedIn: 'root'
})
export class MusicFirestoreService {
    //#region Constants
    readonly MUSIC_COLLECTION = "musics"
    readonly METADATA_COLLECTION = "metadata";
    readonly MUSIC_METADATA_DOC = "musicdata";
    readonly MUSIC_INDEX_DOC = "music_index";
    readonly MUSIC_UPDATES_DOC = "music_updates";


    readonly firestoreConverterMusic = new FirestoreConverter<MusicDto>(MusicDto, { noteData: NoteDataDto, difficultyCriterias: DifficultyCriteria });
    readonly firestoreConverterNote = new FirestoreConverter<NoteDataDto>(NoteDataDto, { difficultyCriterias: DifficultyCriteria });

    readonly protectedFields: (keyof MusicDto)[] = ['artist', 'title', 'offset', 'music', 'stops'];

    //#endregion
    db: Firestore

    constructor(private userFirestoreService: UserFirestoreService) {
        this.db = getFirestore()
    }


    async uploadMusic(dto: MusicDto): Promise<void> {
        try {
            const userId = this.userFirestoreService.getUserData()?.id;
            if (!userId) throw new Error("User not authenticated");

            const musicRef = doc(this.db, this.MUSIC_COLLECTION, dto.id).withConverter(this.firestoreConverterMusic);

            const { noteData: notes, ...mainData } = dto;
            await setDoc(musicRef, mainData);

            this.addGenres(dto.genre ?? "");

            this.updateMusicIndex(dto.id, false);
            AppComponent.presentOkToast("Music successfully uploaded!")
        } catch (error) {
            AppComponent.presentWarningToast("Error uploading music: " + error)
            throw error;
        }
    }

    async updateMusic(dto: MusicDto): Promise<void> {
        try {
            const userId = this.userFirestoreService.getUserData()?.id;
            if (!userId) throw new Error("User not authenticated");

            const musicRef = doc(this.db, this.MUSIC_COLLECTION, dto.id).withConverter(this.firestoreConverterMusic);


            // check protected fields are not modified
            const current = (await getDoc(musicRef)).data();
            if (!current) throw new Error("Music not found");
            for (const field of this.protectedFields) {
                console.log(`Checking field "${field}": current="${current[field]}", new="${dto[field]}"`);
                if (dto[field] !== current[field])
                    throw new Error(`Field "${field}" cannot be modified after upload.`);
            }

            const { noteData: notes, ...mainData } = dto;
            await updateDoc(musicRef, mainData);

            this.addGenres(dto.genre ?? "");

            this.updateMusicIndex(dto.id);
            AppComponent.presentOkToast("Music successfully updated!");
        } catch (error) {
            AppComponent.presentWarningToast("Error updating music: " + error);
            throw error;
        }
    }

    async uploadNotes(musicId: string, notes: NoteDataDto[]): Promise<void> {
        try {
            const userId = this.userFirestoreService.getUserData()?.id;
            if (!userId) throw new Error("User not authenticated");

            const musicRef = doc(this.db, this.MUSIC_COLLECTION, musicId)
                .withConverter(this.firestoreConverterMusic);

            const snap = await getDoc(musicRef);
            if (!snap.exists()) throw new Error("Music not found");

            const music = snap.data();

            const toUpdateNotes: NoteDataDto[] = music.noteData;

            for (const note of notes) {
                // Only allow updates if the user is the creator OR it's a new note
                if (!note.creatorId) {
                    note.creatorId = userId;
                    note.credit = note.credit ?? this.userFirestoreService.getUserData()?.name;
                }

                if (note.creatorId !== userId) {
                    console.log(`Skipping update for note ${note.chartName} - Not the creator`);
                    continue;
                }

                // 2. Add or update the note in the music's noteData array
                const idx = toUpdateNotes.findIndex(n => n.chartName === note.chartName);
                if (idx >= 0) toUpdateNotes[idx] = note;
                else toUpdateNotes.push(note);
            }

            // 3. Rewrite the complete document
            await setDoc(musicRef, { noteData: toUpdateNotes }, { merge: true });

            this.updateMusicIndex(musicId);

        } catch (error) {
            AppComponent.presentWarningToast("Error updating music: " + error);
            throw error;
        }
    }


    async GetAllMusics(): Promise<MusicDto[]> {
        console.log("Querying complete database for music list. This should only happen once per session and will be cached for next calls.");

        const musicRef = collection(this.db, this.MUSIC_COLLECTION).withConverter(this.firestoreConverterMusic);;
        let q = query(musicRef, orderBy(documentId()),);
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty)
            throw new Error("No musics to fetch in database");

        const musics: MusicDto[] = [];
        querySnapshot.forEach(doc => musics.push(doc.data()));

        console.log("Musics retrieved count:", musics.length);
        return musics;
    }


    async getMusicListWithId(ids: string[]): Promise<MusicDto[]> {
        if (ids.length === 0) return [];

        const musicRef = collection(this.db, this.MUSIC_COLLECTION)
            .withConverter(this.firestoreConverterMusic);

        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += 30) {
            chunks.push(ids.slice(i, i + 30));
        }

        const results: MusicDto[] = [];

        for (const chunk of chunks) {
            const q = query(
                musicRef,
                where(documentId(), "in", chunk)
            );

            const snap = await getDocs(q);
            snap.forEach(doc => results.push(doc.data()));
        }

        return results;
    }


    async deleteMusic(musicId: string): Promise<void> {
        try {
            const musicRef = doc(this.db, this.MUSIC_COLLECTION, musicId).withConverter(this.firestoreConverterMusic);

            const snap = await getDoc(musicRef);
            if (!snap.exists()) throw new Error("Music not found");

            const music = snap.data();

            // Vérifier s'il reste des notes embed
            if (music.noteData && music.noteData.length > 0) {
                console.warn("Cannot delete, notes are still present on music:", musicId);
                throw new Error("Cannot delete music with existing notes");
            }

            await deleteDoc(musicRef);

            this.removeMusicFromIndex(musicId);
            AppComponent.presentOkToast("Music successfully deleted!");

        } catch (error) {
            AppComponent.presentErrorToast("Error deleting music: " + error);
            throw error;
        }
    }


    async deleteNote(musicId: string, note: NoteDataDto): Promise<void> {
        try {
            const userId = this.userFirestoreService.getUserData()?.id;
            if (!userId) throw new Error("User not authenticated");

            const musicRef = doc(this.db, this.MUSIC_COLLECTION, musicId).withConverter(this.firestoreConverterMusic);

            const snap = await getDoc(musicRef);
            if (!snap.exists()) throw new Error("Music not found");

            const notedata = snap.data().noteData;
            const idx = notedata.findIndex(n => n.chartName === note.chartName);
            if (idx < 0) throw new Error("Note not found");

            if (notedata[idx].creatorId !== userId)
                throw new Error("User is not the creator of this note");

            // Supprimer la note
            notedata.splice(idx, 1);

            // Réécrire le document complet
            await updateDoc(musicRef, { noteData: notedata });

            this.updateMusicIndex(musicId, false);

        } catch (error) {
            AppComponent.presentWarningToast("Error deleting note: " + error);
            throw error;
        }
    }


    //#region Genres

    async addGenres(genres: string): Promise<void> {
        if (!genres || genres.trim().length === 0) return;

        const normalized = genres.split(',').map(g => g.trim().toLowerCase()).filter(g => g.length > 0);
        if (normalized.length === 0) return;

        const ref = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_METADATA_DOC);
        const snap = await getDoc(ref);


        const existing = snap.data()!['genres'] ?? [];

        if (normalized.every((g: string) => existing.includes(g))) {
            console.log("No new genres to add");
            return;
        }
        const merged = Array.from(new Set([...existing, ...normalized]));

        await updateDoc(ref, { genres: merged });
    }

    async getGenres(): Promise<string[]> {
        const ref = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_METADATA_DOC);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return [];
        }

        const genres = snap.data()?.['genres'] ?? [];

        return genres
            .filter((g: string) => g.length > 0)
            .map((g: string) => g.charAt(0).toUpperCase() + g.slice(1));
    }

    //#endregion

    //#region Updater Mechanism
    async initMusicIndex(): Promise<void> {
        const musicRef = collection(this.db, this.MUSIC_COLLECTION);
        const snapshot = await getDocs(musicRef);

        const ids: string[] = [];
        snapshot.forEach(doc => ids.push(doc.id));

        const indexRef = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_INDEX_DOC);

        await setDoc(indexRef, {
            ids,
            updatedAt: Date.now()
        });

        console.log("Music index initialized:", ids.length, "entries");
    }

    async getUpdate(lastUpdateTimestamp: number, knownIds: Set<string>): Promise<{ newMusicIds: string[], toUpdateMusicIds: string[], toDeleteMusicIds: string[], updatedAt: number } | null> {
        // 1) Read the global timestamp of the last update and the list of all music ids
        const refIndex = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_INDEX_DOC);
        const snapIndex = await getDoc(refIndex);

        if (!snapIndex.exists())
            return null;

        const indexData = snapIndex.data();
        const remoteIds: string[] = indexData['ids'] ?? [];
        const remoteUpdatedAt: number = indexData['updatedAt'] ?? 0;

        // 2) If the global timestamp hasn't changed → nothing to do
        if (remoteUpdatedAt <= lastUpdateTimestamp) {
            return { newMusicIds: [], toUpdateMusicIds: [], toDeleteMusicIds: [], updatedAt: remoteUpdatedAt };
        }

        // 3) Read the incremental updates
        const refUpdates = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_UPDATES_DOC);
        const snapUpdates = await getDoc(refUpdates);

        const updates: Record<string, number> = snapUpdates.exists() ? snapUpdates.data() as Record<string, number> : {};

        // 4) DDetermine the music tracks modified since the last timestamp
        const toUpdateMusicIds = Object.entries(updates).filter(([_, ts]) => ts > lastUpdateTimestamp).map(([id]) => id);

        // 5) Find new musics and deleted musics by comparing the list of ids
        const newMusicIds = remoteIds.filter(id => !knownIds.has(id));
        const toDeleteMusicIds = Array.from(knownIds).filter(id => !remoteIds.includes(id));

        return {
            newMusicIds,
            toUpdateMusicIds,
            toDeleteMusicIds,
            updatedAt: remoteUpdatedAt
        };
    }


    async updateMusicIndex(musicId: string, isUpdate: boolean = true): Promise<void> {
        const indexRef = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_INDEX_DOC);
        const snap = await getDoc(indexRef);

        let ids: string[] = [];

        if (snap.exists()) {
            ids = snap.data()['ids'] ?? [];
        }

        if (!ids.includes(musicId)) {
            ids.push(musicId);
        }

        await setDoc(indexRef, {
            ids,
            updatedAt: Date.now()
        });

        if (!isUpdate) return;

        const updatesRef = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_UPDATES_DOC);
        await setDoc(updatesRef, {
            [musicId]: Date.now()
        }, { merge: true });
    }

    async removeMusicFromIndex(musicId: string): Promise<void> {
        const indexRef = doc(this.db, this.METADATA_COLLECTION, this.MUSIC_INDEX_DOC);
        const snap = await getDoc(indexRef);

        if (!snap.exists()) return;

        let ids: string[] = snap.data()['ids'] ?? [];
        ids = ids.filter(id => id !== musicId);

        await setDoc(indexRef, {
            ids,
            updatedAt: Date.now()
        });

        console.log("Music removed from index:", musicId);
    }


    //#endregion

    async migrateNotesToEmbedded(): Promise<void> {
        console.log("Starting migration of notes → embedded…");

        const musicsRef = collection(this.db, this.MUSIC_COLLECTION)
            .withConverter(this.firestoreConverterMusic);

        const musicsSnap = await getDocs(musicsRef);

        for (const musicDoc of musicsSnap.docs) {
            const musicId = musicDoc.id;
            const music = musicDoc.data();

            console.log(`Checking music: ${musicId}`);

            // 1. Vérifier s'il existe une sous-collection notes
            const notesCollectionRef = collection(
                this.db,
                `${this.MUSIC_COLLECTION}/${musicId}/${"notes"}`
            ).withConverter(this.firestoreConverterNote);

            const notesSnap = await getDocs(notesCollectionRef);

            if (notesSnap.empty) {
                console.log(`→ No notes subcollection for ${musicId}, skipping.`);
                continue;
            }

            console.log(`→ Found ${notesSnap.size} notes for ${musicId}`);

            // 2. Charger toutes les notes existantes
            const embeddedNotes: NoteDataDto[] = [];

            notesSnap.forEach(noteDoc => {
                const note = noteDoc.data();
                embeddedNotes.push(note);
            });

            // 3. Injecter dans noteData
            music.noteData = embeddedNotes;

            // 4. Réécrire la musique complète (avec converter)
            const musicRef = doc(this.db, this.MUSIC_COLLECTION, musicId)
                .withConverter(this.firestoreConverterMusic);

            await setDoc(musicRef, music);

            console.log(`→ Music ${musicId} updated with embedded notes.`);
        }

        console.log("Migration completed!");
    }

}

