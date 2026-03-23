import { SccReader, SccWriter } from "src/app/pages/upload/reader.ssc";
import { readDir, remove } from "@tauri-apps/plugin-fs";

import { BaseDirectory } from "@tauri-apps/api/path";
import { Injectable } from "@angular/core";
import { MusicDto } from "src/app/game/gameModel/music.dto";

@Injectable({ providedIn: 'root' })
export class LocalMusicService {

    private readonly MUSICEDIT_REGISTRY_KEY = 'REGISTRY_MUSICEDIT';
    public readonly MUSICEDIT_STORAGE_KEY = (musicId: string) => `MUSICEDIT_${musicId}`;

    public LocalMusicRegistry: string[] = [];


    constructor() {
        this.LocalMusicRegistry = JSON.parse(localStorage.getItem(this.MUSICEDIT_REGISTRY_KEY) ?? '[]');
    }

    //#region registry management
    private addToEditRegistry(musicId: string) {
        if (this.LocalMusicRegistry.includes(musicId)) return;
        this.LocalMusicRegistry.push(musicId);
        localStorage.setItem(this.MUSICEDIT_REGISTRY_KEY, JSON.stringify(this.LocalMusicRegistry));
    }

    private removeFromEditRegistry(musicId: string) {
        const index = this.LocalMusicRegistry.indexOf(musicId);
        if (index !== -1) {
            this.LocalMusicRegistry.splice(index, 1);
            localStorage.setItem(this.MUSICEDIT_REGISTRY_KEY, JSON.stringify(this.LocalMusicRegistry));
        }
    }

    public async clearAllLocalMusics() {
        this.LocalMusicRegistry = JSON.parse(localStorage.getItem(this.MUSICEDIT_REGISTRY_KEY) ?? '[]')

        for (const musicId of this.LocalMusicRegistry) {
            const key = this.MUSICEDIT_STORAGE_KEY(musicId);
            localStorage.removeItem(key);
        }

        // Clear internal state
        this.LocalMusicRegistry = [];
        localStorage.removeItem(this.MUSICEDIT_REGISTRY_KEY);

        this.clearMusicFolder();
    }
    private async clearMusicFolder() {
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

    //#endregion

    //#region Load 


    /** Load a music */
    public getMusic(musicId: string): MusicDto | null {
        const raw = localStorage.getItem(this.MUSICEDIT_STORAGE_KEY(musicId));
        if (!raw) return null;
        return SccReader.parseFile(`${musicId}.essc`, raw);
    }

    public getAllLocalMusics(search?: string): MusicDto[] {
        const storedMusics: MusicDto[] = [];
        const query = search?.trim().toLowerCase() ?? null;

        for (const musicId of this.LocalMusicRegistry) {
            const storedData = localStorage.getItem(this.MUSICEDIT_STORAGE_KEY(musicId));

            if (!storedData) {
                console.warn(`⚠️ No data for music ${musicId} → cleaning registry`);
                localStorage.removeItem(this.MUSICEDIT_STORAGE_KEY(musicId));
                const index = this.LocalMusicRegistry.indexOf(musicId);
                if (index !== -1) this.LocalMusicRegistry.splice(index, 1);
                continue;
            }

            const musicData = SccReader.extractBasicMetadataFromSSC(storedData);

            if (query) {
                const haystack = [
                    musicData.title,
                    musicData.artist,
                    musicId
                ]
                    .filter(Boolean)
                    .map(x => x!.toLowerCase());

                const match = haystack.some(x => x.includes(query));
                if (!match) continue;
            }

            const storedMusic = new MusicDto();
            storedMusic.title = musicData.title;
            storedMusic.artist = musicData.artist;
            storedMusic.jacket = musicData.jacket;
            storedMusic.bpms = musicData.bpms ?? [];

            storedMusics.push(storedMusic);
        }

        return storedMusics;
    }
    public getAllLocalMusicsFull(search?: string): MusicDto[] {
        const fullMusics: MusicDto[] = [];
        const query = search?.trim().toLowerCase() ?? null;

        for (const musicId of this.LocalMusicRegistry) {
            const storedData = localStorage.getItem(this.MUSICEDIT_STORAGE_KEY(musicId));

            if (!storedData) {
                console.warn(`⚠️ No data for music ${musicId} → cleaning registry`);
                localStorage.removeItem(this.MUSICEDIT_STORAGE_KEY(musicId));
                const index = this.LocalMusicRegistry.indexOf(musicId);
                if (index !== -1) this.LocalMusicRegistry.splice(index, 1);
                continue;
            }

            // Charge le MusicDto complet
            const fullMusic = SccReader.parseFile(`${musicId}.essc`, storedData);

            if (!fullMusic) continue;

            // Recherche optionnelle
            if (query) {
                const haystack = [
                    fullMusic.title,
                    fullMusic.artist,
                    musicId
                ]
                    .filter(Boolean)
                    .map(x => x!.toLowerCase());

                const match = haystack.some(x => x.includes(query));
                if (!match) continue;
            }

            fullMusics.push(fullMusic);
        }

        return fullMusics;
    }

    //#endregion

    //#region Save
    public saveMusic(music: MusicDto) {
        localStorage.setItem(this.MUSICEDIT_STORAGE_KEY(music.id), SccWriter.writeSscFile(music));
        this.addToEditRegistry(music.id);
    }

    public deleteMusic(musicId: string) {
        localStorage.removeItem(this.MUSICEDIT_STORAGE_KEY(musicId));
        this.removeFromEditRegistry(musicId);
    }
    //#endregion

}