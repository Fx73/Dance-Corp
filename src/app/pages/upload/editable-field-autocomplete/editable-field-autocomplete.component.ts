import { Component, ElementRef, EventEmitter, Input, Output } from "@angular/core";
import { IonInput, IonItem, IonLabel } from "@ionic/angular/standalone";

import { SanitizeSscInput } from "../reader.ssc";

@Component({
  selector: 'music-editable-field-autocomplete',
  templateUrl: './editable-field-autocomplete.component.html',
  styleUrls: ['./editable-field-autocomplete.component.scss'],
  standalone: true,
  imports: [IonItem, IonLabel, IonInput]
})
export class MusicEditableFieldAutocompleteComponent {
  @Input() isEditing = false;

  @Input() label!: string;
  @Input() type: 'string' | 'number' = 'string';

  @Input() value!: any;
  @Input() valueDb: any = null;

  @Input() warningMessage: string | null = null;

  @Input() suggestions: string[] = [];

  @Output() valueChange = new EventEmitter<any>();

  public isDirty = false;

  constructor(public elementRef: ElementRef) { }

  ngOnChanges() {
    this.isDirty = this.isEditing && this.normalize(this.value) !== this.normalize(this.valueDb);
  }

  onInputChange(ev: any) {
    let newValue = ev.detail.value;
    newValue = SanitizeSscInput(newValue);

    this.isDirty = this.isEditing && this.normalize(newValue) !== this.normalize(this.valueDb);
    this.valueChange.emit(newValue);
  }


  get isChanged(): boolean {
    return this.isEditing && this.normalize(this.value) !== this.normalize(this.valueDb);
  }

  private normalize(v: any): string {
    if (v === undefined || v === null) return "";
    return String(v).trim();
  }


  filteredGenres: string[] = [];
  onInput(event: any) {
    const value = (event.target.value || '').toLowerCase();

    const parts = value.split(',');
    const lastPart = parts[parts.length - 1].trim();

    if (lastPart.length === 0) {
      this.filteredGenres = [];
      return;
    }

    this.filteredGenres = this.suggestions
      .filter(g => g.toLowerCase().includes(lastPart))
      .filter(g => !this.value.includes(g));
    ;
  }

  selectGenre(g: string) {
    const current = this.value || '';

    const parts = current.split(',');
    parts[parts.length - 1] = ' ' + g;
    this.value = parts.join(',').trim();

    this.filteredGenres = [];
  }
}
