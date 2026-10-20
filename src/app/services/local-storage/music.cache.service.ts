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
            const raw = localStorage.getItem(this.MUSIC_STORAGE_KEY(id))
            if (!raw) continue
            try {
                this.musics.push(MusicDto.FromJSON(JSON.parse(raw)))
            } catch { }
        }

    }

    get allRemoteMusics(): MusicDto[] {
        return this.musics.filter(m => this.localMusicService.registry.has(m.id) === false)
    }

    async UpdateCache() {
        const ts = parseInt(localStorage.getItem(this.MUSIC_REGISTRY_TS_KEY) || '0')
        if (ts === 0) {
            this.musics = await this.musicFirestoreService.GetAllMusics()
            for (const music of this.musics) {
                localStorage.setItem(this.MUSIC_STORAGE_KEY(music.id), JSON.stringify(music))
                this.registry.add(music.id)
            }
            localStorage.setItem(this.MUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)))
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
            localStorage.removeItem(this.MUSIC_STORAGE_KEY(musicId))
            this.musics = this.musics.filter(m => m.id !== musicId)
            this.registry.delete(musicId)
        }

        if (updateInfo.toUpdateMusicIds.length > 0) {
            const updatedMusics = await this.musicFirestoreService.GetMusicListWithId(updateInfo.toUpdateMusicIds)

            for (const music of updatedMusics) {
                this.musics = this.musics.filter(m => m.id !== music.id)
                this.musics.push(music)
                localStorage.setItem(this.MUSIC_STORAGE_KEY(music.id), JSON.stringify(music))
                this.registry.add(music.id)
            }
        }

        if (updateInfo.newMusicIds.length > 0) {
            const newMusics = await this.musicFirestoreService.GetMusicListWithId(updateInfo.newMusicIds)

            for (const music of newMusics) {
                this.musics.push(music)
                localStorage.setItem(this.MUSIC_STORAGE_KEY(music.id), JSON.stringify(music))
                this.registry.add(music.id)
            }
        }

        localStorage.setItem(this.MUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)))
        localStorage.setItem(this.MUSIC_REGISTRY_TS_KEY, updateInfo.updatedAt.toString())

        AppComponent.PresentOkToast(`Music list updated: ${updateInfo.newMusicIds.length} new, ${updateInfo.toUpdateMusicIds.length} updated, ${updateInfo.toDeleteMusicIds.length} deleted.`)
    }

    async UpdateCacheMusic(musicId: string) {
        try {
            const musics = await this.musicFirestoreService.GetMusicListWithId([musicId])
            const music = musics[0]
            if (!music) return

            this.musics = this.musics.filter(m => m.id !== music.id)
            this.musics.push(music)
            localStorage.setItem(this.MUSIC_STORAGE_KEY(music.id), JSON.stringify(music))
            this.registry.add(music.id)
            localStorage.setItem(this.MUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)))
            console.log(`Music ${musicId} updated in cache.`)

        } catch (e) {
            console.error(`Failed to update music ${musicId} in cache:`, e)
        }
    }

    GetMusic(musicId: string): MusicDto | null {
        const cacheKey = this.MUSIC_STORAGE_KEY(musicId)

        const raw = localStorage.getItem(cacheKey)
        if (raw) {
            try {
                return MusicDto.FromJSON(JSON.parse(raw))
            } catch { }
        }

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

    async GetMusicWithDbNoUpdate(musicId: string): Promise<MusicDto | null> {
        const cacheKey = this.MUSIC_STORAGE_KEY(musicId)

        const raw = localStorage.getItem(cacheKey)
        if (raw) {
            try {
                return MusicDto.FromJSON(JSON.parse(raw))
            } catch { }
        }

        console.error(`Music ${musicId} not found in cache, fetching from server...`)

        const music = (await this.musicFirestoreService.GetMusicListWithId([musicId]))[0]
        if (!music) return null

        localStorage.setItem(this.MUSIC_STORAGE_KEY(musicId), JSON.stringify(music))

        this.registry.add(musicId)
        localStorage.setItem(this.MUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)))

        return music
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
            this.UpdateCache()
            throw e
        }
        music.noteData = []
        this.musics.push(music)
        localStorage.setItem(this.MUSIC_STORAGE_KEY(music.id), JSON.stringify(music))
        this.registry.add(music.id)
        localStorage.setItem(this.MUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)))
    }

    async UpdateMusicInBase(music: MusicDto): Promise<void> {
        try {
            await this.musicFirestoreService.UpdateMusic(music)
        } catch (e) {
            this.UpdateCache()
            throw e
        }
        this.musics = this.musics.filter(m => m.id !== music.id)
        this.musics.push(music)
        localStorage.setItem(this.MUSIC_STORAGE_KEY(music.id), JSON.stringify(music))
        this.registry.add(music.id)
        localStorage.setItem(this.MUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)))
    }

    async DeleteMusicInBase(musicId: string): Promise<void> {
        try {
            await this.musicFirestoreService.DeleteMusic(musicId)
        } catch (e) {
            this.UpdateCache()
            throw e
        }

        this.musics = this.musics.filter(m => m.id !== musicId)
        this.registry.delete(musicId)
        localStorage.removeItem(this.MUSIC_STORAGE_KEY(musicId))
        localStorage.setItem(this.MUSIC_REGISTRY_KEY, JSON.stringify(Array.from(this.registry)))
    }

    async UploadNotesInBase(musicId: string, notes: NoteDataDto[]): Promise<void> {
        try {
            await this.musicFirestoreService.UploadNotes(musicId, notes)
        } catch (e) {
            this.UpdateCache()
            throw e
        }
        const music = this.musics.find(m => m.id === musicId)
        if (!music) return
        music.noteData = music.noteData.concat(notes)
        localStorage.setItem(this.MUSIC_STORAGE_KEY(music.id), JSON.stringify(music))
    }

    async DeleteNoteInBase(musicId: string, note: NoteDataDto): Promise<void> {
        try {
            await this.musicFirestoreService.DeleteNote(musicId, note)
        } catch (e) {
            this.UpdateCache()
            throw e
        }
        const music = this.musics.find(m => m.id === musicId)
        if (!music) return
        music.noteData = music.noteData.filter(n => n.chartName !== note.chartName)
        localStorage.setItem(this.MUSIC_STORAGE_KEY(music.id), JSON.stringify(music))
    }
}
