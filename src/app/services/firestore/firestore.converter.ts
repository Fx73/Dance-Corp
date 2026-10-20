import { DocumentData, QueryDocumentSnapshot, Timestamp } from "firebase/firestore"

export class FirestoreConverter<T extends object> {
    //#region Constants
    readonly IGNORE_UNDEFINED: boolean = true
    readonly IGNORED_FIELDS: Set<string> = new Set(["additionalFields"])
    //#endregion

    readonly type
    readonly subtypes: Record<string, new () => object> = {}

    constructor(type: new() => T, subtypes: Record<string, new () => object> = {}) {
        this.type = type
        this.subtypes = subtypes
    }

    toFirestore(dto: T): DocumentData {
        return this.toFirestoreRecurse(dto)
    }

    toFirestoreRecurse(dto: object): DocumentData {
        const data: DocumentData = {}
        Object.keys(dto).forEach((key) => {
            const value = Reflect.get(dto, key)
            if (this.IGNORED_FIELDS.has(key)) {
                // Well ... ignore
            }
            else if (value === undefined) {
                if (!this.IGNORE_UNDEFINED) data[key] = null
            }
            else if (Array.isArray(value))
                data[key] = value.map(v => Object(v) === v ? this.toFirestoreRecurse(v) : v)
            else if (value instanceof Date)
                data[key] = value
            else if (Object(value) === value)
                data[key] = this.toFirestoreRecurse(value)
            else
                data[key] = value
        })
        return data
    }

    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): T {
        const data = snapshot.data()
        const dto = new this.type()
        return this.fromFirestoreRecurse(data, dto) as T
    }

    fromFirestoreRecurse(data: DocumentData, dto: object = {}): object {
        Object.keys(data).forEach((key) => {
            let value = data[key]
            if (Array.isArray(value))
                value = this.mapArrayRecurse(value, key)
            else if (value instanceof Timestamp)
                value = value.toDate()
            else if (Object(value) === value) {
                const subtype = this.subtypes[key]
                value = this.fromFirestoreRecurse(value, subtype ? new subtype() : undefined)
            }

            Reflect.set(dto, key, value)
        })
        return dto
    }

    mapArrayRecurse(array: unknown[], arrayName: string): unknown[] {
        // Is empty or primitive
        if (array.length === 0 || Object(array[0]) !== array[0])
            return array

        // Is poorly Converted Array
        if (Object.keys(array[0] as object).every((x, index) => Number(x) === index)) {
            return array.map(x => this.mapArrayRecurse(Object.values(x as object), arrayName))
        }
        // Is Object
        const subtype = this.subtypes[arrayName]
        return array.map(x => this.fromFirestoreRecurse(x as DocumentData, subtype ? new subtype() : undefined))
    }

}

export class SimpleFirestoreConverter<T extends object> {
    //#region Constants
    readonly IGNORE_UNDEFINED: boolean = true
    readonly IGNORED_FIELDS: Set<string> = new Set(["additionalFields"])
    //#endregion

    readonly type

    constructor(type: new() => T) {
        this.type = type
    }

    toFirestore(dto: T): DocumentData {
        const data: DocumentData = {}
        Object.keys(dto).forEach((key) => {
            if (!this.IGNORED_FIELDS.has(key)) {
                const value = Reflect.get(dto, key)
                if (!this.IGNORE_UNDEFINED || value !== undefined) {
                    data[key] = value
                }
            }
        })
        return data
    }

    fromFirestore(snapshot: QueryDocumentSnapshot<T>): T {
        const data = snapshot.data()
        const dto = new this.type()
        Object.keys(data).forEach((key) => {
            Reflect.set(dto, key, data[key as keyof T])
        })
        return dto
    }
}