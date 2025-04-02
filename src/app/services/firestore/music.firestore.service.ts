import { Firestore, addDoc, collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, startAfter, where } from 'firebase/firestore';
import { MusicDto, NotesDto } from '../../game/gameModel/music.dto';

import { FirestoreConverter } from './firestore.converter';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MusicFirestoreService {
    //#region Constants
    readonly MUSIC_COLLECTION = "musics"
    readonly NOTE_COLLECTION = "notes"
    readonly BATCH_SIZE = 60;
    readonly firestoreConverterMusic = new FirestoreConverter<MusicDto>(MusicDto)
    readonly firestoreConverterNotes = new FirestoreConverter<NotesDto>(NotesDto)
    //#endregion
    db: Firestore

    constructor() {
        this.db = getFirestore()
    }


    async uploadNewMusic(dto: MusicDto): Promise<void> {
        try {
            const docRef = doc(this.db, this.MUSIC_COLLECTION, dto.id).withConverter(this.firestoreConverterMusic);
            const notesCollectionRef = collection(docRef, this.NOTE_COLLECTION).withConverter(this.firestoreConverterNotes);

            const { notes, ...mainData } = dto;

            await setDoc(docRef, mainData);
            for (const note of notes) {
                const noteRef = doc(notesCollectionRef, note.chartName);
                await setDoc(noteRef, note);
            }


            console.log('Music successfully uploaded!');
        } catch (error) {
            console.error('Error uploading music:', error);
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


    async getMusicNotes(musicId: string): Promise<NotesDto[]> {
        try {
            const notesCollectionRef = collection(this.db, this.MUSIC_COLLECTION + "/" + musicId + "/" + this.NOTE_COLLECTION).withConverter(this.firestoreConverterNotes);
            const q = query(notesCollectionRef, orderBy('meter'));
            const querySnapshot = await getDocs(q);

            const notes: NotesDto[] = [];
            querySnapshot.forEach(doc => {
                notes.push(doc.data());
            });

            return notes;
        } catch (error) {
            console.error('Erreur lors de la récupération des notes :', error);
            throw error;
        }
    }


}

