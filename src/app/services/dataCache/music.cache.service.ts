import { MusicDto, NoteDataDto } from "src/app/game/gameModel/music.dto";

import { DanceType } from "src/app/game/constants/dance-type.enum";
import { Injectable } from "@angular/core";
import { MusicFirestoreService } from "../firestore/music.firestore.service";
import { UserConfigService } from 'src/app/services/userconfig.service';

@Injectable({ providedIn: 'root' })
export class MusicCacheService {
    private readonly MUSIC_STORAGE_KEY = (musicId: string) => `MUSIC_${musicId}`;
    private readonly MUSIC_REGISTRY_KEY = 'REGISTRY_MUSIC';

    private registry: string[] = [];

    constructor(private musicFireStoreService: MusicFirestoreService, private userConfigService: UserConfigService) {
        const raw = localStorage.getItem(this.MUSIC_REGISTRY_KEY);
        if (raw) {
            try {
                this.registry = JSON.parse(raw);
            } catch (e) {
                console.error('Failed to parse music registry:', e);
                console.error('If this error persists, please clear your local storage.');
                this.registry = [];
            }
        }
    }

    async getMusicNotes(musicId: string, onlySingle: boolean = false): Promise<NoteDataDto[]> {
        const cacheKey = this.MUSIC_STORAGE_KEY(musicId);
        const isCacheEnabled = this.userConfigService.getConfig()['allowCache']

        if (isCacheEnabled && this.registry.includes(musicId)) {
            const raw = localStorage.getItem(cacheKey);
            if (raw) {
                try {
                    let music = JSON.parse(raw) as MusicDto;
                    music = MusicDto.fromJSON(music);
                    return music.noteData.filter(note => !onlySingle || note.stepsType === DanceType.DanceSingle) || [];
                } catch (e) {
                    console.warn(`Failed to parse notes from cache for ${musicId}`, e);
                }
            }
        }
        return this.musicFireStoreService.getMusicNotes(musicId, onlySingle);
    }

    addMusicToCache(music: MusicDto) {
        const cacheKey = this.MUSIC_STORAGE_KEY(music.id);
        localStorage.setItem(cacheKey, JSON.stringify(music));
        if (!this.registry.includes(music.id)) {
            this.registry.push(music.id);
            localStorage.setItem(this.MUSIC_REGISTRY_KEY, JSON.stringify(this.registry));
        }
    }

    clearCache(): void {
        // Remove all MUSIC_<musicId> entries
        for (const musicId of this.registry) {
            const key = this.MUSIC_STORAGE_KEY(musicId);
            localStorage.removeItem(key);
        }

        // Clear internal state
        this.registry = [];
        localStorage.removeItem(this.MUSIC_REGISTRY_KEY);
    }


}
