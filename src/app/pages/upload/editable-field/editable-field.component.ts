import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, inject } from "@angular/core";
import { IonInput, IonItem, IonLabel } from "@ionic/angular";
import { IMusicEditableField, MUSIC_EDITABLE_FIELD_TOKEN } from "../editable-field.interface";

import { SanitizeSscInput } from "../reader.ssc";

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
export class MusicEditableFieldComponent implements IMusicEditableField, OnChanges {
  elementRef = inject(ElementRef);

  @Input() isEditing = false;

  @Input() label!: string;
  @Input() type: 'string' | 'number' = 'string';

  @Input() value!: any;
  @Input() valueDb: any = null;

  @Input() warningMessage: string | null = null;

  @Output() valueChange = new EventEmitter<any>();

  public isDirty = false;

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


}
