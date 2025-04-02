import { BehaviorSubject, Observable } from 'rxjs';
import { Firestore, FirestoreDataConverter, QueryDocumentSnapshot, collection, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc } from 'firebase/firestore';
import { UserDto, UserMusicDto, UserNoteDto } from 'src/app/pages/user-profile/user.dto';

import { GameRound } from 'src/app/game/gameModel/gameRound';
import { Injectable } from '@angular/core';
import { LoginFireauthService } from 'src/app/services/firestore/login.fireauth.service';
import { SimpleFirestoreConverter } from './firestore.converter';
import { User } from 'firebase/auth';

@Injectable({
    providedIn: 'root'
})
export class UserFirestoreService {
    //#region Constants
    private readonly USER_COLLECTION = "users"
    private readonly USER_MUSIC_COLLECTION = "userMusics"
    private readonly USER_NOTES_COLLECTION = "userNotes"
    private readonly firestoreConverterUserMusic = new SimpleFirestoreConverter<UserMusicDto>(UserMusicDto)
    private readonly firestoreConverterUserNote = new SimpleFirestoreConverter<UserNoteDto>(UserNoteDto)

    //#endregion

    private db: Firestore
    private user: UserDto | null = null;
    private userDataSubject = new BehaviorSubject<UserDto | null>(null);
    get userData$(): Observable<UserDto | null> {
        return this.userDataSubject.asObservable();
    }
    public getUserData(): UserDto | null {
        return this.user;
    }

    constructor(loginFireauthService: LoginFireauthService) {
        this.db = getFirestore()
        loginFireauthService.listenForUserChanges(firebaseUser => {
            if (firebaseUser) {
                this.getUserFromFirestore(firebaseUser).then(user => {
                    this.user = user
                    this.userDataSubject.next(user);
                })
            } else {
                this.user = null;
                this.userDataSubject.next(null);
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


    public async updateUserStatsFromRound(musicId: string, noteId: string, gameRound: GameRound): Promise<void> {
        const score = gameRound.score
        const userId = gameRound.player.userId

        if (userId === null)
            return

        const userRef = doc(this.db, this.USER_COLLECTION, userId).withConverter(this.userConverter);
        const musicRef = doc(this.db, this.USER_COLLECTION, userId, this.USER_MUSIC_COLLECTION, musicId).withConverter(this.firestoreConverterUserMusic);
        const noteRef = doc(this.db, this.USER_COLLECTION, userId, this.USER_MUSIC_COLLECTION, musicId, this.USER_NOTES_COLLECTION, noteId).withConverter(this.firestoreConverterUserNote);

        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists() && userSnapshot.data()) {
            await updateDoc(userRef, {
                musicPlayed: (userSnapshot.data()['musicPlayed'] || 0) + 1,
                musicCleared: gameRound.isFinished ? userSnapshot.data()['musicCleared'] + 1 : userSnapshot.data()['musicCleared']
            });
        }

        const musicSnapshot = await getDoc(musicRef);
        if (!musicSnapshot.exists() || !musicSnapshot.data()) {
            const newMusic = new UserMusicDto(musicId)
            newMusic.timesPlayed += 1
            await setDoc(musicRef, newMusic);
        } else {
            await updateDoc(musicRef, {
                timesPlayed: (musicSnapshot.data().timesPlayed || 0) + 1
            });
        }

        const noteSnapshot = await getDoc(noteRef);
        const gamepadUsed = gameRound.player.gamepad?.id ?? "Unknown gamepad"
        if (!noteSnapshot.exists() || !noteSnapshot.data()) {
            const newNotes = new UserNoteDto(noteId)
            newNotes.timesPlayed += 1
            newNotes.highScore = score
            newNotes.highScoreGamepad = gamepadUsed
            await setDoc(noteRef, newNotes);
        } else {
            const currentMaxScore = noteSnapshot.data().highScore || 0;
            await updateDoc(noteRef, {
                timesPlayed: noteSnapshot.data()['timesPlayed'] + 1,
                maxScore: score > currentMaxScore ? score : currentMaxScore,
                usedGamepad: score > currentMaxScore ? gamepadUsed : noteSnapshot.data().highScoreGamepad
            });

        }

    }


    public async getScoresForMusic(musicId: string, userId: string): Promise<{ [noteId: string]: number; }> {
        const musicRef = doc(this.db, this.USER_COLLECTION, userId, this.USER_MUSIC_COLLECTION, musicId);
        const notesCollection = collection(musicRef, this.USER_NOTES_COLLECTION);
        const querySnapshot = await getDocs(notesCollection);

        console.log("Requested : ", musicId)

        const scores: { [noteId: string]: number } = {};
        querySnapshot.forEach(doc => {
            const data = doc.data();
            scores[doc.id] = data['highScore']; // Stocke chaque note avec son high score
        });
        console.log("Got : ", scores)

        return scores;
    }

    readonly userConverter: FirestoreDataConverter<UserDto> = {
        toFirestore(user: UserDto): FirebaseFirestore.DocumentData {
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
