import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core'
import { IonButton, IonIcon, IonInput, IonItem, IonLabel, IonList } from "@ionic/angular"
import { addOutline, removeOutline } from 'ionicons/icons'

import { FormsModule } from '@angular/forms'
import { ITimedChange } from 'src/app/game/game-model/timeline/timedChange'
import { SanitizeSscInput } from '../reader.ssc'
import { addIcons } from 'ionicons'

@Component({
  selector: 'app-music-editable-list',
  templateUrl: './editable-list.component.html',
  styleUrls: ['./editable-list.component.scss'],
  standalone: true,
  imports: [IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon, FormsModule]
})
export class MusicEditableListComponent<T extends ITimedChange = ITimedChange> implements OnChanges {
  elementRef = inject(ElementRef)

  @Input() isEditing = false

  @Input() label!: string
  @Input() valueType: 'string' | 'number' = 'string'

  @Input() value: T[] = []
  @Input() valueDb: T[] | undefined = []

  @Output() valueChange: EventEmitter<T[]> = new EventEmitter()

  public isDirty = false

  constructor() {
    addIcons({ removeOutline, addOutline })
  }

  ngOnChanges() {
    this.isDirty = this.isChanged
  }

  OnFieldChange() {
    this.isDirty = this.isChanged
    this.value = this.value.map(row => ({
      ...row,
      // A timed change always has a value: an emptied field becomes ""
      value: this.valueType === 'string'
        ? SanitizeSscInput(String(row.value)) ?? ""
        : row.value
    }))

    this.valueChange.emit(this.value)
  }

  private Normalize(v: unknown, type: 'string' | 'number'): string {
    if (v === undefined || v === null) return ""
    if (type === 'number') return String(Number(v))
    return String(v).trim()
  }

  IsRowChanged(i: number): boolean {
    if (!this.isEditing) return false

    const row = this.value[i]
    const rowDb = this.valueDb?.[i]
    if (!rowDb) return true

    return (
      this.Normalize(row.time, 'number') !== this.Normalize(rowDb.time, 'number') ||
      this.Normalize(row.value, this.valueType) !== this.Normalize(rowDb.value, this.valueType)
    )
  }

  get isChanged(): boolean {
    if (!this.isEditing) return false
    if (this.value.length !== this.valueDb?.length) return true
    return this.value.some((_, i) => this.IsRowChanged(i))
  }

  AddRow() {
    this.value.push({
      time: 0,
      value: this.valueType === 'number' ? 0 : ''
    } as T)

    this.isDirty = this.isChanged
    this.valueChange.emit(this.value)
  }

  RemoveRow(i: number) {
    this.value.splice(i, 1)

    this.isDirty = this.isChanged
    this.valueChange.emit(this.value)
  }

  FormatRow(row: T | undefined): string {
    if (!row) return ''
    return Object.entries(row)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ')
  }

}
