import { AppComponent } from "src/app/app.component";
import { Injectable } from "@angular/core";
import { MusicDto } from "src/app/game/gameModel/music.dto";
import { MusicFirestoreService } from "../firestore/music.firestore.service";
import { musicLocalService } from 'src/app/services/localStorage/local.music.service';

@Injectable({ providedIn: 'root' })
export class MusicCacheService {
    private readonly MUSIC_STORAGE_KEY = (musicId: string) => `MUSIC_${musicId}`;
    private readonly MUSIC_REGISTRY_KEY = 'REGISTRY_MUSIC';
    private readonly MUSIC_REGISTRY_TS_KEY = 'REGISTRY_MUSIC_TS';

    private registry: Set<string> = new Set();

    musics: MusicDto[] = [];

    constructor(private musicFirestoreService: MusicFirestoreService, private localMusicService: musicLocalService) {
        this.registry = new Set(JSON.parse(localStorage.getItem(this.MUSIC_REGISTRY_KEY) ?? '[]'));

        for (const id of this.registry) {
            const raw = localStorage.getItem(this.MUSIC_STORAGE_KEY(id));
            if (!raw) continue;
            try {
                this.musics.push(MusicDto.fromJSON(JSON.parse(raw)));
            } catch { }
        }

    }

    get allRemoteMusics(): MusicDto[] {
        return this.musics.filter(m => this.localMusicService.registry.has(m.id) === false);
    }


    async updateCache() {
        const ts = parseInt(localStorage.getItem(this.MUSIC_REGISTRY_TS_KEY) || '0');
        if (ts === 0) {
            this.musics = await this.musicFirestoreService.GetAllMusics()
            for (const music of this.musics) {
                localStorage.setItem(this.MUSIC_STORAGE_KEY(music.id), JSON.stringify(music));
                this.registry.add(music.id);
            }
            localStorage.setItem(this.MUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)));
            localStorage.setItem(this.MUSIC_REGISTRY_TS_KEY, Date.now().toString());
            return;
        }


        const updateInfo = await this.musicFirestoreService.getUpdate(ts, this.registry);
        if (!updateInfo) {
            AppComponent.presentErrorToast("Failed to fetch music updates from server.");
            return
        }

        if (updateInfo.newMusicIds.length === 0 && updateInfo.toUpdateMusicIds.length === 0 && updateInfo.toDeleteMusicIds.length === 0) {
            console.log("Music cache is already up to date.");
            return;
        }

        for (const musicId of updateInfo.toDeleteMusicIds) {
            localStorage.removeItem(this.MUSIC_STORAGE_KEY(musicId));
            this.musics = this.musics.filter(m => m.id !== musicId);
            this.registry.delete(musicId);
        }

        if (updateInfo.toUpdateMusicIds.length > 0) {
            const updatedMusics = await this.musicFirestoreService.getMusicListWithId(updateInfo.toUpdateMusicIds);

            for (const music of updatedMusics) {
                this.musics = this.musics.filter(m => m.id !== music.id);
                this.musics.push(music);
                localStorage.setItem(this.MUSIC_STORAGE_KEY(music.id), JSON.stringify(music));
                this.registry.add(music.id);
            }
        }

        if (updateInfo.newMusicIds.length > 0) {
            const newMusics = await this.musicFirestoreService.getMusicListWithId(updateInfo.newMusicIds);

            for (const music of newMusics) {
                this.musics.push(music);
                localStorage.setItem(this.MUSIC_STORAGE_KEY(music.id), JSON.stringify(music));
                this.registry.add(music.id);
            }
        }

        localStorage.setItem(this.MUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)));
        localStorage.setItem(this.MUSIC_REGISTRY_TS_KEY, updateInfo.updatedAt.toString());

        AppComponent.presentOkToast(`Music list updated: ${updateInfo.newMusicIds.length} new, ${updateInfo.toUpdateMusicIds.length} updated, ${updateInfo.toDeleteMusicIds.length} deleted.`);
    }


    async getMusic(musicId: string): Promise<MusicDto | null> {
        const cacheKey = this.MUSIC_STORAGE_KEY(musicId);

        const raw = localStorage.getItem(cacheKey);
        if (raw) {
            try {
                return MusicDto.fromJSON(JSON.parse(raw));
            } catch { }
        }

        console.error(`Music ${musicId} not found in cache, fetching from server...`);

        const music = (await this.musicFirestoreService.getMusicListWithId([musicId]))[0];
        if (!music) return null;

        localStorage.setItem(this.MUSIC_STORAGE_KEY(musicId), JSON.stringify(music));

        this.registry.add(musicId);
        localStorage.setItem(this.MUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)));

        return music;
    }

    clearCache(): void {
        for (const musicId of this.registry) {
            localStorage.removeItem(this.MUSIC_STORAGE_KEY(musicId));
        }
        this.registry = new Set();
        localStorage.removeItem(this.MUSIC_REGISTRY_KEY);
        localStorage.removeItem(this.MUSIC_REGISTRY_TS_KEY);
    }



}
