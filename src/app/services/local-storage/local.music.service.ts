import { readDir, remove } from "@tauri-apps/plugin-fs";

import { BaseDirectory } from "@tauri-apps/api/path";
import { Injectable } from "@angular/core";
import { MusicDto } from "src/app/game/game-model/music.dto";

@Injectable({ providedIn: 'root' })
export class musicLocalService {

    private readonly MUSICEDIT_REGISTRY_KEY = 'REGISTRY_MUSICEDIT';
    public readonly MUSICEDIT_STORAGE_KEY = (musicId: string) => `MUSICEDIT_${musicId}`;

    public registry: Set<string> = new Set();

    musics: MusicDto[] = [];


    constructor() {
        this.registry = new Set(JSON.parse(localStorage.getItem(this.MUSICEDIT_REGISTRY_KEY) ?? '[]'));

        for (const musicId of this.registry) {
            const raw = localStorage.getItem(this.MUSICEDIT_STORAGE_KEY(musicId));
            if (raw) {
                try {
                    this.musics.push(MusicDto.fromJSON(JSON.parse(raw)));
                } catch (e) {
                    console.error(`Failed to parse local music ${musicId}:`, e);
                }
            }
            else {
                console.warn(`⚠️ No data for music ${musicId} → cleaning registry`);
                localStorage.removeItem(this.MUSICEDIT_STORAGE_KEY(musicId));
                this.registry.delete(musicId);
            };

        }

    }

    get allLocalMusics(): MusicDto[] {
        return this.musics;
    }


    addMusic(music: MusicDto) {
        if (this.registry.has(music.id)) {
            console.warn(`Music ${music.id} already exists in local registry. Not adding.`);
            return;
        }
        this.musics.push(music);
        localStorage.setItem(this.MUSICEDIT_STORAGE_KEY(music.id), JSON.stringify(music));
        this.registry.add(music.id);
        localStorage.setItem(this.MUSICEDIT_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)));
    }

    updateMusic(music: MusicDto) {
        const index = this.musics.findIndex(m => m.id === music.id);
        if (index === -1) {
            console.warn(`Music ${music.id} not found in local registry. Adding as new music.`);
            this.addMusic(music);
            return;
        }
        this.musics[index] = music;
        localStorage.setItem(this.MUSICEDIT_STORAGE_KEY(music.id), JSON.stringify(music));
    }

    deleteMusic(musicId: string) {
        localStorage.removeItem(this.MUSICEDIT_STORAGE_KEY(musicId));
        this.registry.delete(musicId);
        localStorage.setItem(this.MUSICEDIT_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)));
        this.musics = this.musics.filter(m => m.id !== musicId);
    }


    public getMusic(musicId: string): MusicDto | null {
        const raw = localStorage.getItem(this.MUSICEDIT_STORAGE_KEY(musicId));
        if (!raw) return null;
        return MusicDto.fromJSON(JSON.parse(raw));
    }



    public async clearAllLocalMusics() {
        this.registry = new Set(JSON.parse(localStorage.getItem(this.MUSICEDIT_REGISTRY_KEY) ?? '[]'));

        for (const musicId of this.registry) {
            const key = this.MUSICEDIT_STORAGE_KEY(musicId);
            localStorage.removeItem(key);
        }

        // Clear internal state
        this.registry = new Set();
        localStorage.removeItem(this.MUSICEDIT_REGISTRY_KEY);

        // Clear music folder
        try {
            const list = await readDir("music", {
                baseDir: BaseDirectory.AppData
            });

            for (const file of list) {
                if (file.name) {
                    await remove(`music/${file.name}`, {
                        baseDir: BaseDirectory.AppData
                    });
                    console.log("Deleted:", file.name);
                }
            }

        } catch (err) {
            console.error("Error clearing music folder:", err);
        }
    }

}