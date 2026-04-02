import { Injectable, effect } from "@angular/core";
import { UserDto, UserMusicDto, UserNoteDto } from 'src/app/pages/user-profile/user.dto';

import { GameRound } from "src/app/game/gameModel/gameRound";
import { UserFirestoreService } from 'src/app/services/firestore/user.firestore.service';

@Injectable({ providedIn: 'root' })
export class UserCacheService {
    private readonly USER_KEY = "LAST_LOGGED_IN_USER";
    private readonly USERMUSIC_REGISTRY_KEY = 'REGISTRY_USER_MUSIC';
    private readonly USERMUSIC_STORAGE_KEY = (musicId: string) => `USER_MUSIC_${musicId}`;

    private registry: Set<string> = new Set();
    private userMusics: UserMusicDto[] = [];

    private isSessionOnly = false;

    constructor(private userFirestoreService: UserFirestoreService) {
        effect(() => {
            const user = this.userFirestoreService.user;
            this.onUserDataChange(user);
        });

    }

    onUserDataChange(user: UserDto | null) {
        if (user) {
            console.log(`User logged in: ${user.name} (${user.id}). Checking cache...`);
            const lastUser = localStorage.getItem(this.USER_KEY);
            this.isSessionOnly = false;

            if (lastUser === user.id) {
                this.initCacheFromStorage();
            } else {
                this.clearCache();
                localStorage.setItem(this.USER_KEY, user.id);
                this.initCacheFromFirestore(user.id);
            }
        } else {
            console.log("User logged out, clearing cache.");
            this.registry.clear();
            this.userMusics = [];
            this.isSessionOnly = true;
        }
    }

    initCacheFromStorage() {
        this.registry = new Set(JSON.parse(localStorage.getItem(this.USERMUSIC_REGISTRY_KEY) || '[]'));
        this.userMusics = [];
        for (const musicId of this.registry) {
            const raw = localStorage.getItem(this.USERMUSIC_STORAGE_KEY(musicId));
            if (raw) {
                this.userMusics.push(JSON.parse(raw));
            }
        }
        console.log(`Loaded ${this.userMusics.length} musics from localStorage.`);
    }

    private async initCacheFromFirestore(userId: string) {
        console.log("Loading user music registry from Firestore...");

        const musics = await this.userFirestoreService.getAllUserMusics(userId);

        this.registry.clear();
        this.userMusics = [];

        for (const music of musics) {
            this.registry.add(music.id);
            this.userMusics.push(music);
            localStorage.setItem(this.USERMUSIC_STORAGE_KEY(music.id), JSON.stringify(music));
        }

        localStorage.setItem(this.USERMUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)));

        console.log(`Loaded ${musics.length} musics from Firestore.`);
    }

    clearCache() {
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.USERMUSIC_REGISTRY_KEY);
        for (const musicId of this.registry) {
            localStorage.removeItem(this.USERMUSIC_STORAGE_KEY(musicId));
        }
        this.registry.clear();
        this.userMusics = [];
    }

    public getMusicStats(musicId: string): UserMusicDto {
        if (this.registry.has(musicId) === false)
            return new UserMusicDto(musicId);

        return this.userMusics.find(music => music.id === musicId) || new UserMusicDto(musicId);
    }

    public updateUserStatsFromRound(musicId: string, noteId: string, gameRound: GameRound) {
        console.log(this.userMusics)
        // 1. Ensure registry entry exists
        let music = this.userMusics.find(m => m.id === musicId);
        console.log("found", musicId, music)
        if (!music) {
            music = new UserMusicDto(musicId);
            this.userMusics.push(music);
            this.registry.add(musicId);
            if (!this.isSessionOnly) {
                localStorage.setItem(this.USERMUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)));
            }
        }
        console.log(music)

        // 3. Ensure note exists
        let note = music.notes.find(n => n.id === noteId);
        if (!note) {
            note = new UserNoteDto(noteId);
            music.notes.push(note);
        }
        console.log(music)

        // 4. Update music stats
        music.timesPlayed += 1;
        console.log(music)

        note.passed = note.passed || gameRound.isFinished;
        note.timesPlayed += 1;
        note.highScore = Math.max(note.highScore, Math.round(gameRound.score));
        note.highScoreGamepad = gameRound.player.gamepad?.id ?? "Unknown gamepad";

        // 5. Stop here if session-only
        if (this.isSessionOnly) return;

        // 6. Update LocalStorage
        localStorage.setItem(this.USERMUSIC_STORAGE_KEY(musicId), JSON.stringify(music));

        // 7. Update Firestore
        console.log(music)
        this.userFirestoreService.updateUserStatsFromRound(music, gameRound);
    }

}