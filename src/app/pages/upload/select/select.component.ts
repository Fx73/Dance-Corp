import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core'
import { IonItem, IonLabel, IonSelect, IonSelectOption, SelectCustomEvent } from "@ionic/angular"

@Component({
  selector: 'app-music-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  standalone: true,
  imports: [IonLabel, IonItem, IonSelect, IonSelectOption]
})
export class MusicSelectComponent<T = unknown> implements OnChanges {
  elementRef = inject(ElementRef)

  @Input() label!: string
  @Input() value!: T
  @Input() valueDb: T | null | undefined = null
  @Input() isEditing = false

  @Input() options: T[] = []

  @Output() valueChange: EventEmitter<T> = new EventEmitter()

  public isDirty = false

  ngOnChanges() {
    this.isDirty = this.isEditing && this.Normalize(this.value) !== this.Normalize(this.valueDb)
  }

  OnSelectChange(ev: SelectCustomEvent<T>) {
    this.isDirty = this.isEditing && this.Normalize(ev.detail.value) !== this.Normalize(this.valueDb)
    this.valueChange.emit(ev.detail.value)
  }

  get isChanged(): boolean {
    return this.isEditing && this.Normalize(this.value) !== this.Normalize(this.valueDb)
  }

  private Normalize(v: unknown): string {
    if (v === undefined || v === null) return ""
    return String(v).trim()
  }

}
