import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild, inject } from "@angular/core";
import { InputChangeEventDetail, InputCustomEvent, IonInput, IonItem, IonLabel } from "@ionic/angular";
import { IMusicEditableField, MUSIC_EDITABLE_FIELD_TOKEN } from "../editable-field.interface";

import { SanitizeSscInput } from "../reader.ssc";

@Component({
  selector: 'app-music-editable-field-autocomplete',
  providers: [
    { provide: MUSIC_EDITABLE_FIELD_TOKEN, useExisting: MusicEditableFieldAutocompleteComponent }
  ],
  templateUrl: './editable-field-autocomplete.component.html',
  styleUrls: ['./editable-field-autocomplete.component.scss'],
  standalone: true,
  imports: [IonItem, IonLabel, IonInput]
})
export class MusicEditableFieldAutocompleteComponent<T extends string | null | undefined = string | null | undefined> implements IMusicEditableField, OnChanges {
  elementRef = inject(ElementRef);

  @Input() isEditing = false;

  @Input() label!: string;
  @Input() type: 'string' | 'number' = 'string';

  @Input() value!: T;
  @Input() valueDb: T | null = null;

  @Input() warningMessage: string | null = null;

  @Input() suggestions: string[] = [];

  @Output() valueChange: EventEmitter<T> = new EventEmitter();

  @ViewChild(IonInput) genreInput!: IonInput;


  public isDirty = false;

  ngOnChanges() {
    this.isDirty = this.isEditing && this.normalize(this.value) !== this.normalize(this.valueDb);
  }

  onInputChange(ev: InputCustomEvent<InputChangeEventDetail>) {
    const rawValue = ev.detail.value;
    const newValue = SanitizeSscInput(rawValue == null ? null : String(rawValue));

    this.isDirty = this.isEditing && this.normalize(newValue) !== this.normalize(this.valueDb);
    // SanitizeSscInput renvoie une string (ou null), émise telle quelle
    this.valueChange.emit(newValue as T);
  }


  get isChanged(): boolean {
    return this.isEditing && this.normalize(this.value) !== this.normalize(this.valueDb);
  }

  private normalize(v: unknown): string {
    if (v === undefined || v === null) return "";
    return String(v).trim();
  }


  filteredGenres: string[] = [];
  onInput(event: Event) {
    const value = String((event.target as HTMLIonInputElement).value || '').toLowerCase();

    const parts = value.split(',');
    const lastPart = parts[parts.length - 1].trim();

    if (lastPart.length === 0) {
      this.filteredGenres = [];
      return;
    }

    this.filteredGenres = this.suggestions
      .filter(g => g.toLowerCase().includes(lastPart))
      .filter(g => !this.value?.includes(g));
    ;
  }

  selectGenre(g: string) {
    const current = this.value || '';
    console.log(' value   genre:', g);

    const parts = current.split(',');
    parts[parts.length - 1] = ' ' + g;
    this.value = parts.join(',').trim() as T;

    this.filteredGenres = [];

    setTimeout(() => {
      this.genreInput.setFocus();
    }, 0);
  }

  onFocus() {
    if (!this.value) return;
    if (!this.value.trim().endsWith(',')) {
      this.value = this.value.trim() + ', ' as T;
    }
  }

  onBlur() {
    setTimeout(() => {
      this.filteredGenres = [];

      if (!this.value) return;
      this.value = this.value.trim().replace(/[, ]+$/, '').trim() as T;
    }, 150);
  }

}
