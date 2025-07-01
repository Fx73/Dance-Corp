import { Firestore, addDoc, collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, startAfter, updateDoc, where } from 'firebase/firestore';
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
    readonly BATCH_SIZE = 60;
    readonly firestoreConverterMusic = new FirestoreConverter<MusicDto>(MusicDto)
    readonly firestoreConverterNotes = new FirestoreConverter<NoteDataDto>(NoteDataDto)
    //#endregion
    db: Firestore

    constructor(private userFirestoreService: UserFirestoreService) {
        this.db = getFirestore()
    }


    async uploadNewMusic(dto: MusicDto): Promise<void> {
        try {
            const userId = this.userFirestoreService.getUserData()?.id;
            if (!userId) throw new Error("User not authenticated");

            const docRef = doc(this.db, this.MUSIC_COLLECTION, dto.id).withConverter(this.firestoreConverterMusic);
            const notesCollectionRef = collection(docRef, this.NOTE_COLLECTION).withConverter(this.firestoreConverterNotes);

            const { noteData: notes, ...mainData } = dto;
            await setDoc(docRef, mainData);
            for (const note of notes) {
                if (!note.creatorId) note.creatorId = userId;
                if (!note.credit) note.credit = this.userFirestoreService.getUserData()?.name;
                const noteRef = doc(notesCollectionRef, note.chartName);
                await setDoc(noteRef, note);
            }

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

            const docRef = doc(this.db, this.MUSIC_COLLECTION, dto.id).withConverter(this.firestoreConverterMusic);
            const notesCollectionRef = collection(docRef, this.NOTE_COLLECTION).withConverter(this.firestoreConverterNotes);

            const { noteData: notes, ...mainData } = dto;
            await updateDoc(docRef, mainData);

            for (const note of notes) {
                // Only allow updates if the user is the creator OR it's a new note
                const noteRef = doc(notesCollectionRef, note.chartName);
                console.log(note)
                console.log(note.creatorId)
                console.log(note.creatorId, userId, note.creatorId === userId)
                if (note.creatorId === userId) {
                    console.log("Update")
                    await updateDoc(noteRef, { ...note });
                } else if (!note.creatorId) {
                    if (!note.creatorId) note.creatorId = userId; // Assign creator if it's new
                    if (!note.credit) note.credit = this.userFirestoreService.getUserData()?.name;
                    console.log("Create")
                    await setDoc(noteRef, note);
                }
                else {
                    console.log(`Skipping update for note ${note.chartName} - Not the creator`);
                }
            }

            AppComponent.presentOkToast("Music successfully updated!");

        } catch (error) {
            AppComponent.presentWarningToast("Error updating music: " + error);
            throw error;
        }
    }

    async existsMusic(musicId: string): Promise<boolean> {
        const docSnap = await getDoc(doc(this.db, this.MUSIC_COLLECTION, musicId))
        return docSnap.exists();
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


    async GetAllMusics(lastMusicId: string | null): Promise<MusicDto[]> {
        const musics: MusicDto[] = [];
        const musicRef = collection(this.db, this.MUSIC_COLLECTION).withConverter(this.firestoreConverterMusic);;

        const q = query(
            musicRef,
            orderBy('title'),
            startAfter(lastMusicId),
            limit(this.BATCH_SIZE)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty)
            throw new Error("No more musics to fetch");

        querySnapshot.forEach((doc) => {
            musics.push(doc.data());
        });
        console.log("Musics retrieved:", musics);
        return musics;
    }

    async GetAllMusicsWithSearch(lastMusicId: string | null, searchTerm: string): Promise<MusicDto[]> {
        const musics: MusicDto[] = [];
        const musicRef = collection(this.db, this.MUSIC_COLLECTION).withConverter(this.firestoreConverterMusic);

        const q = query(
            musicRef,
            where('title', ">=", searchTerm),
            where('title', "<", searchTerm + "z"),
            orderBy('title'),
            startAfter(lastMusicId),
            limit(this.BATCH_SIZE)
        );

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


}

