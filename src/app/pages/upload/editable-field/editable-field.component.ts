import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, inject } from "@angular/core"
import { InputChangeEventDetail, InputCustomEvent, IonInput, IonItem, IonLabel } from "@ionic/angular"
import { IMusicEditableField, MUSIC_EDITABLE_FIELD_TOKEN } from "../editable-field.interface"

import { SanitizeSscInput } from "../reader.ssc"

@Component({
  selector: 'app-music-editable-field',
  providers: [
    { provide: MUSIC_EDITABLE_FIELD_TOKEN, useExisting: MusicEditableFieldComponent }
  ],
  templateUrl: './editable-field.component.html',
  styleUrls: ['./editable-field.component.scss'],
  standalone: true,
  imports: [IonItem, IonLabel, IonInput]
})
export class MusicEditableFieldComponent<T extends string | number | null | undefined = string | number | null | undefined> implements IMusicEditableField, OnChanges {
  elementRef = inject(ElementRef)

  @Input() isEditing = false

  @Input() label!: string
  @Input() type: 'string' | 'number' = 'string'

  @Input() value!: T
  @Input() valueDb: T | null = null

  @Input() warningMessage: string | null = null

  @Output() valueChange: EventEmitter<T> = new EventEmitter()

  public isDirty = false

  ngOnChanges() {
    this.isDirty = this.isEditing && this.Normalize(this.value) !== this.Normalize(this.valueDb)
  }

  OnInputChange(ev: InputCustomEvent<InputChangeEventDetail>) {
    const rawValue = ev.detail.value
    const newValue = SanitizeSscInput(rawValue == null ? null : String(rawValue))

    this.isDirty = this.isEditing && this.Normalize(newValue) !== this.Normalize(this.valueDb)
    // SanitizeSscInput returns a string (or null), emitted as is even if the bound field is a number
    this.valueChange.emit(newValue as T)
  }

  get isChanged(): boolean {
    return this.isEditing && this.Normalize(this.value) !== this.Normalize(this.valueDb)
  }

  private Normalize(v: unknown): string {
    if (v === undefined || v === null) return ""
    return String(v).trim()
  }

}
