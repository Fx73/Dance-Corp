import { DocumentData, Firestore, FirestoreDataConverter, QueryDocumentSnapshot, collection, doc, getDoc, getDocs, getFirestore, increment, setDoc, updateDoc } from 'firebase/firestore';
import { Injectable, signal } from '@angular/core';
import { UserDto, UserMusicDto, UserNoteDto } from 'src/app/pages/user-profile/user.dto';

import { FirestoreConverter } from './firestore.converter';
import { GameRound } from 'src/app/game/gameModel/gameRound';
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service';
import { User } from 'firebase/auth';

@Injectable({
    providedIn: 'root'
})
export class UserFirestoreService {
    //#region Constants
    private readonly USER_COLLECTION = "users"
    private readonly USER_MUSIC_COLLECTION = "user_musics"
    private readonly firestoreConverterUserMusic = new FirestoreConverter<UserMusicDto>(UserMusicDto, { "notes:": UserNoteDto });
    //#endregion

    private db: Firestore
    private _userData = signal<UserDto | null>(null);
    public readonly userData = this._userData.asReadonly();
    public get user(): UserDto | null {
        return this._userData();
    }



    constructor(loginFireauthService: LoginFireauthService) {
        this.db = getFirestore()
        loginFireauthService.listenForUserChanges(firebaseUser => {
            if (firebaseUser) {
                this.getUserFromFirestore(firebaseUser).then(user => {
                    this._userData.set(user);
                })
            } else {
                this._userData.set(null);
            }
        })
    }

    private async getUserFromFirestore(firebaseUser: User): Promise<UserDto> {
        const userRef = doc(this.db, this.USER_COLLECTION, firebaseUser.uid).withConverter(this.userConverter);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
            const userData: UserDto = userSnapshot.data();
            return userData
        } else {
            const newUser = new UserDto(firebaseUser.uid, firebaseUser.displayName || 'Unknown User');
            newUser.avatar = firebaseUser.photoURL ?? ""
            await setDoc(userRef, newUser);

            return newUser;
        }
    }

    public async getAllUserMusics(userId: string): Promise<UserMusicDto[]> {
        if (!userId) return [];

        const collectionRef = collection(this.db, this.USER_COLLECTION, userId, this.USER_MUSIC_COLLECTION).withConverter(this.firestoreConverterUserMusic);
        const snap = await getDocs(collectionRef);

        if (snap.empty) return [];
        const musics: UserMusicDto[] = [];

        snap.forEach(doc => { musics.push(doc.data()); });

        return musics;
    }


    public async updateUserStatsFromRound(music: UserMusicDto, gameRound: GameRound): Promise<void> {
        const userId = gameRound.player.userId;
        if (!userId) return;

        const userRef = doc(this.db, this.USER_COLLECTION, userId);
        const musicRef = doc(userRef, this.USER_MUSIC_COLLECTION, music.id).withConverter(this.firestoreConverterUserMusic);

        // 1. Update global stats (increment)
        await updateDoc(userRef, {
            musicPlayed: increment(1),
            musicCleared: gameRound.isFinished ? increment(1) : increment(0)
        });

        // 2. Persist the updated music object
        await setDoc(musicRef, music, { merge: true });
    }


    public async getScoresForMusic(musicId: string, userId: string): Promise<{ [noteId: string]: number }> {
        const musicRef = doc(this.db, this.USER_COLLECTION, userId, this.USER_MUSIC_COLLECTION, musicId).withConverter(this.firestoreConverterUserMusic);

        const snap = await getDoc(musicRef);
        if (!snap.exists()) return {};

        const music = snap.data();

        const scores: { [noteId: string]: number } = {};
        for (const note of music.notes) {
            scores[note.id] = note.highScore ?? 0;
        }

        return scores;
    }



    readonly userConverter: FirestoreDataConverter<UserDto> = {
        toFirestore(user: UserDto): DocumentData {
            return {
                id: user.id,
                name: user.name,
                avatar: user.avatar || '',
                level: user.level,
                musicPlayed: user.musicPlayed,
                musicCleared: user.musicCleared,
                preferedGamepad: user.preferedGamepad
            };
        },

        fromFirestore(snapshot: QueryDocumentSnapshot, options: any): UserDto {
            const data = snapshot.data();
            const user = new UserDto(data["id"], data["name"]);

            if (data["avatar"]) user.avatar = data["avatar"];
            if (data["level"]) user.level = data["level"];
            if (data["musicPlayed"]) user.musicPlayed = data["musicPlayed"];
            if (data["musicCleared"]) user.musicCleared = data["musicCleared"];
            if (data["preferedGamepad"]) user.preferedGamepad = data["preferedGamepad"];
            if (data["preferedMusic"]) user.preferedMusic = data["preferedMusic"];

            return user;
        }

    };

}
