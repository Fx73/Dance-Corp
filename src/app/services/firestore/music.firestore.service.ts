import { Firestore, addDoc, collection, deleteDoc, doc, documentId, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, startAfter, updateDoc, where } from 'firebase/firestore';
import { MusicDto, NoteDataDto } from '../../game/gameModel/music.dto';

import { AppComponent } from 'src/app/app.component';
import { DanceType } from 'src/app/game/constants/dance-type.enum';
import { FirestoreConverter } from './firestore.converter';
import { Injectable } from '@angular/core';
import { UserFirestoreService } from './user.firestore.service';

@Injectable({
    providedIn: 'root'
})
export class MusicFirestoreService {
    //#region Constants
    readonly MUSIC_COLLECTION = "musics"
    readonly NOTE_COLLECTION = "notes"
    readonly METADATA_COLLECTION = "metadata";
    readonly MUSIC_METADATA_DOC = "musicdata";

    readonly BATCH_SIZE = 60;
    readonly firestoreConverterMusic = new FirestoreConverter<MusicDto>(MusicDto)
    readonly firestoreConverterNotes = new FirestoreConverter<NoteDataDto>(NoteDataDto)

    readonly protectedFields: (keyof MusicDto)[] = ['artist', 'title', 'offset', 'music'];

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

            AppComponent.presentOkToast("Music successfully updated!");
        } catch (error) {
            AppComponent.presentWarningToast("Error updating music: " + error);
            throw error;
        }
    }


    async uploadNote(musicId: string, note: NoteDataDto): Promise<void> {
        try {
            const userId = this.userFirestoreService.getUserData()?.id;
            if (!userId) throw new Error("User not authenticated");

            if (!note.creatorId) {// Assign creator if it's new
                note.creatorId = userId;
                if (!note.credit) note.credit = this.userFirestoreService.getUserData()?.name;
            }

            if (note.creatorId !== userId)
                throw new Error("User is not the creator of this note");

            const docRef = doc(this.db, this.MUSIC_COLLECTION, musicId).withConverter(this.firestoreConverterMusic);
            const notesCollectionRef = collection(docRef, this.NOTE_COLLECTION).withConverter(this.firestoreConverterNotes);
            console.log(note.chartName)
            const noteRef = doc(notesCollectionRef, note.chartName);
            await setDoc(noteRef, note);

        } catch (error) {
            AppComponent.presentWarningToast("Error updating notes: " + error);
            throw error;
        }
    }

    async uploadAllNotes(musicId: string, notes: NoteDataDto[]): Promise<void> {
        try {
            const userId = this.userFirestoreService.getUserData()?.id;
            if (!userId) throw new Error("User not authenticated");

            const docRef = doc(this.db, this.MUSIC_COLLECTION, musicId).withConverter(this.firestoreConverterMusic);
            const notesCollectionRef = collection(docRef, this.NOTE_COLLECTION).withConverter(this.firestoreConverterNotes);

            for (const note of notes) {
                // Only allow updates if the user is the creator OR it's a new note
                const noteRef = doc(notesCollectionRef, note.chartName);
                if (!note.creatorId) {// Assign creator if it's new
                    note.creatorId = userId;
                    if (!note.credit) note.credit = this.userFirestoreService.getUserData()?.name;
                }

                if (note.creatorId === userId)
                    await setDoc(noteRef, note);
                else
                    console.log(`Skipping update for note ${note.chartName} - Not the creator`);

            }

        } catch (error) {
            AppComponent.presentWarningToast("Error updating music: " + error);
            throw error;
        }
    }




    async getMusic(documentId: string): Promise<MusicDto | null> {
        try {
            const docRef = doc(this.db, this.MUSIC_COLLECTION, documentId).withConverter(this.firestoreConverterMusic);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                console.warn(`Document ${documentId} does not exist!`);
                return null;
            }
        } catch (error) {
            console.error('Error retrieving music:', error);
            throw error;
        }
    }


    async GetAllMusics(lastMusicId: string | null = null): Promise<MusicDto[]> {
        const musics: MusicDto[] = [];
        const musicRef = collection(this.db, this.MUSIC_COLLECTION).withConverter(this.firestoreConverterMusic);;
        console.log("Query at ", lastMusicId);

        let q;

        if (lastMusicId) {
            q = query(
                musicRef,
                orderBy(documentId()),
                startAfter(lastMusicId),
                limit(this.BATCH_SIZE)
            );
        } else {
            q = query(
                musicRef,
                orderBy(documentId()),
                limit(this.BATCH_SIZE)
            );
        }

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty)
            throw new Error("No more musics to fetch");

        querySnapshot.forEach((doc) => {
            musics.push(doc.data());
        });
        console.log("Musics retrieved :", musics);
        return musics;
    }

    async GetAllMusicsWithSearch(lastMusicId: string | null, searchTerm: string): Promise<MusicDto[]> {
        const musics: MusicDto[] = [];
        const musicRef = collection(this.db, this.MUSIC_COLLECTION).withConverter(this.firestoreConverterMusic);

        let q;
        if (lastMusicId) {
            q = query(
                musicRef,
                where('title', ">=", searchTerm),
                where('title', "<", searchTerm + "z"),
                orderBy(documentId()),
                startAfter(lastMusicId),
                limit(this.BATCH_SIZE)
            );
        } else {
            q = query(
                musicRef,
                where('title', ">=", searchTerm),
                where('title', "<", searchTerm + "z"),
                orderBy(documentId()),
                limit(this.BATCH_SIZE)
            );
        }

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty)
            throw new Error("No more musics to fetch");

        querySnapshot.forEach((doc) => {
            musics.push(doc.data());
        });

        return musics;
    }


    async getMusicNotes(musicId: string, onlySingle: boolean = false): Promise<NoteDataDto[]> {
        try {
            const notesCollectionRef = collection(this.db, this.MUSIC_COLLECTION + "/" + musicId + "/" + this.NOTE_COLLECTION).withConverter(this.firestoreConverterNotes);
            const q = query(notesCollectionRef, orderBy('meter'));
            const querySnapshot = await getDocs(q);

            const notes: NoteDataDto[] = [];
            querySnapshot.forEach(doc => {
                if (!onlySingle || doc.data().stepsType === DanceType.DanceSingle)
                    notes.push(doc.data());
            });
            console.log("Notes retrieved:", notes);
            return notes;
        } catch (error) {
            console.error('Error retrieving notes :', error);
            throw error;
        }
    }

    async getMusicWithNotes(musicId: string): Promise<MusicDto | null> {
        const music = await this.getMusic(musicId);
        if (music)
            music.noteData = await this.getMusicNotes(musicId);
        return music;
    }

    async deleteMusic(musicId: string): Promise<void> {
        try {
            const musicRef = doc(this.db, this.MUSIC_COLLECTION, musicId);
            const notesCollectionRef = collection(musicRef, this.NOTE_COLLECTION)
            const snapshot = await getDocs(notesCollectionRef);
            if (!snapshot.empty) {
                console.warn("Cannot delete, notes are still present on music :", musicId);
            }

            await deleteDoc(musicRef);
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

            if (note.creatorId !== userId)
                throw new Error("User is not the creator of this note");

            const docRef = doc(this.db, this.MUSIC_COLLECTION, musicId).withConverter(this.firestoreConverterMusic);
            const notesCollectionRef = collection(docRef, this.NOTE_COLLECTION).withConverter(this.firestoreConverterNotes);

            const noteRef = doc(notesCollectionRef, note.chartName);
            await deleteDoc(noteRef);

        } catch (error) {
            AppComponent.presentWarningToast("Error updating notes: " + error);
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
}

