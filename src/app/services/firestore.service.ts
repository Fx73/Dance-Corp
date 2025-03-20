import { Firestore, addDoc, collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, startAfter, where } from 'firebase/firestore';
import { MusicDto, Notes } from './../game/dto/music.dto';

import { FirestoreConverter } from './firestore.converter';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FireStoreService {
    //#region Constants
    readonly MUSIC_COLLECTION = "musics"
    readonly BATCH_SIZE = 60;
    readonly firestoreConverterMusic = new FirestoreConverter<MusicDto>(MusicDto)
    readonly firestoreConverterNotes = new FirestoreConverter<Notes>(Notes)
    //#endregion
    db: Firestore

    constructor() {
        this.db = getFirestore()
    }


    async uploadNewMusic(dto: MusicDto): Promise<void> {
        try {
            const docRef = doc(this.db, this.MUSIC_COLLECTION, dto.id).withConverter(this.firestoreConverterMusic);
            const notesCollectionRef = collection(docRef, 'notes').withConverter(this.firestoreConverterNotes);

            const { notes, ...mainData } = dto;

            await setDoc(docRef, mainData);
            for (const note of notes)
                await addDoc(notesCollectionRef, note);


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


}

