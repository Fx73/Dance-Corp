import { MusicDto, NoteDataDto } from "src/app/game/game-model/music.dto"

import { Injectable, inject } from "@angular/core"
import { AppComponent } from "src/app/app.component"
import { MusicLocalService } from 'src/app/services/local-storage/local.music.service'
import { MusicFirestoreService } from "../firestore/music.firestore.service"

@Injectable({ providedIn: 'root' })
export class MusicCacheService {
    //#region Constants
    private readonly MUSIC_STORAGE_KEY = (musicId: string) => `MUSIC_${musicId}`
    private readonly MUSIC_REGISTRY_KEY = 'REGISTRY_MUSIC'
    private readonly MUSIC_REGISTRY_TS_KEY = 'REGISTRY_MUSIC_TS'
    //#endregion

    private musicFirestoreService = inject(MusicFirestoreService)
    private localMusicService = inject(MusicLocalService)

    private registry: Set<string> = new Set()

    musics: MusicDto[] = []

    constructor() {
        this.registry = new Set(JSON.parse(localStorage.getItem(this.MUSIC_REGISTRY_KEY) ?? '[]'))

        for (const id of this.registry) {
            const music = this.ReadCachedMusic(id)
            if (music) this.musics.push(music)
        }

    }

    get allRemoteMusics(): MusicDto[] {
        return this.musics.filter(m => this.localMusicService.registry.has(m.id) === false)
    }

    /** Never throws: a failed update is reported with a toast, and the cache keeps its previous state */
    async UpdateCache() {
        try {
            await this.FetchCacheUpdate()
        } catch (error) {
            AppComponent.PresentErrorToast("Failed to update the music list: " + error)
        }
    }

    private async FetchCacheUpdate() {
        const ts = parseInt(localStorage.getItem(this.MUSIC_REGISTRY_TS_KEY) || '0')
        if (ts === 0) {
            const allMusics = await this.musicFirestoreService.GetAllMusics()
            this.musics = []
            for (const music of allMusics) {
                this.PersistMusic(music)
            }
            this.SaveRegistry()
            localStorage.setItem(this.MUSIC_REGISTRY_TS_KEY, Date.now().toString())
            return
        }

        const updateInfo = await this.musicFirestoreService.GetUpdate(ts, this.registry)
        if (!updateInfo) {
            AppComponent.PresentErrorToast("Failed to fetch music updates from server.")
            return
        }

        if (updateInfo.newMusicIds.length === 0 && updateInfo.toUpdateMusicIds.length === 0 && updateInfo.toDeleteMusicIds.length === 0) {
            console.log("Music cache is already up to date.")
            return
        }

        for (const musicId of updateInfo.toDeleteMusicIds) {
            this.RemoveMusic(musicId)
        }

        if (updateInfo.toUpdateMusicIds.length > 0) {
            const updatedMusics = await this.musicFirestoreService.GetMusicListWithId(updateInfo.toUpdateMusicIds)

            for (const music of updatedMusics) {
                this.PersistMusic(music)
            }
        }

        if (updateInfo.newMusicIds.length > 0) {
            const newMusics = await this.musicFirestoreService.GetMusicListWithId(updateInfo.newMusicIds)

            for (const music of newMusics) {
                this.PersistMusic(music)
            }
        }

        this.SaveRegistry()
        localStorage.setItem(this.MUSIC_REGISTRY_TS_KEY, updateInfo.updatedAt.toString())

        AppComponent.PresentOkToast(`Music list updated: ${updateInfo.newMusicIds.length} new, ${updateInfo.toUpdateMusicIds.length} updated, ${updateInfo.toDeleteMusicIds.length} deleted.`)
    }

    async UpdateCacheMusic(musicId: string) {
        try {
            const musics = await this.musicFirestoreService.GetMusicListWithId([musicId])
            const music = musics[0]
            if (!music) return

            this.PersistMusic(music)
            this.SaveRegistry()
            console.log(`Music ${musicId} updated in cache.`)

        } catch (e) {
            console.error(`Failed to update music ${musicId} in cache:`, e)
        }
    }

    GetMusic(musicId: string): MusicDto | null {
        const music = this.ReadCachedMusic(musicId)
        if (music) return music

        console.error(`Music ${musicId} not found in cache`)
        return null
    }

    async GetMusicWithCheck(musicId: string): Promise<MusicDto | null> {
        const music = this.GetMusic(musicId)
        if (music)
            return music

        console.warn(`Music ${musicId} not found in cache, updating cache...`)
        await this.UpdateCache()
        return this.GetMusic(musicId)

    }

    /** A corrupted entry is removed from the cache and the registry, so that it is fetched again with the next catalog change */
    private ReadCachedMusic(musicId: string): MusicDto | null {
        const raw = localStorage.getItem(this.MUSIC_STORAGE_KEY(musicId))
        if (!raw) return null

        try {
            return MusicDto.FromJSON(JSON.parse(raw))
        } catch (error) {
            console.error(`Music ${musicId} is corrupted in cache, removing it:`, error)
            this.RemoveMusic(musicId)
            this.SaveRegistry()
            return null
        }
    }

    ClearCache(): void {
        for (const musicId of this.registry) {
            localStorage.removeItem(this.MUSIC_STORAGE_KEY(musicId))
        }
        this.registry = new Set()
        localStorage.removeItem(this.MUSIC_REGISTRY_KEY)
        localStorage.removeItem(this.MUSIC_REGISTRY_TS_KEY)
    }

    async CreateMusicInBase(music: MusicDto): Promise<void> {
        try {
            await this.musicFirestoreService.UploadMusic(music)
        } catch (e) {
            await this.UpdateCache()
            throw e
        }
        music.noteData = []
        this.PersistMusic(music)
        this.SaveRegistry()
    }

    async UpdateMusicInBase(music: MusicDto): Promise<void> {
        try {
            await this.musicFirestoreService.UpdateMusic(music)
        } catch (e) {
            await this.UpdateCache()
            throw e
        }
        this.PersistMusic(music)
        this.SaveRegistry()
    }

    async DeleteMusicInBase(musicId: string): Promise<void> {
        try {
            await this.musicFirestoreService.DeleteMusic(musicId)
        } catch (e) {
            await this.UpdateCache()
            throw e
        }

        this.RemoveMusic(musicId)
        this.SaveRegistry()
    }

    async UploadNotesInBase(musicId: string, notes: NoteDataDto[]): Promise<void> {
        try {
            await this.musicFirestoreService.UploadNotes(musicId, notes)
        } catch (e) {
            await this.UpdateCache()
            throw e
        }
        const music = this.musics.find(m => m.id === musicId)
        if (!music) return
        for (const note of notes) {
            const idx = music.noteData.findIndex(n => n.chartName === note.chartName)
            if (idx >= 0) music.noteData[idx] = note
            else music.noteData.push(note)
        }
        this.PersistMusic(music)
    }

    async DeleteNoteInBase(musicId: string, note: NoteDataDto): Promise<void> {
        try {
            await this.musicFirestoreService.DeleteNote(musicId, note)
        } catch (e) {
            await this.UpdateCache()
            throw e
        }
        const music = this.musics.find(m => m.id === musicId)
        if (!music) return
        music.noteData = music.noteData.filter(n => n.chartName !== note.chartName)
        this.PersistMusic(music)
    }

    //#region Persistence
    /** Adds or replaces the music in memory and in localStorage, keeping its position in the list. The registry is saved by SaveRegistry() */
    private PersistMusic(music: MusicDto) {
        const index = this.musics.findIndex(m => m.id === music.id)
        if (index >= 0) this.musics[index] = music
        else this.musics.push(music)

        localStorage.setItem(this.MUSIC_STORAGE_KEY(music.id), JSON.stringify(music))
        this.registry.add(music.id)
    }

    /** Removes the music from memory and from localStorage. The registry is saved by SaveRegistry() */
    private RemoveMusic(musicId: string) {
        this.musics = this.musics.filter(m => m.id !== musicId)
        localStorage.removeItem(this.MUSIC_STORAGE_KEY(musicId))
        this.registry.delete(musicId)
    }

    private SaveRegistry() {
        localStorage.setItem(this.MUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)))
    }
    //#endregion
}
