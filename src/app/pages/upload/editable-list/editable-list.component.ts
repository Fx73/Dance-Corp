import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { IonButton, IonIcon, IonInput, IonItem, IonLabel, IonList } from "@ionic/angular";
import { addOutline, removeOutline } from 'ionicons/icons';

import { FormsModule } from '@angular/forms';
import { ITimedChange } from 'src/app/game/game-model/timeline/timedChange';
import { SanitizeSscInput } from '../reader.ssc';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-music-editable-list',
  templateUrl: './editable-list.component.html',
  styleUrls: ['./editable-list.component.scss'],
  standalone: true,
  imports: [IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon, FormsModule]
})
export class MusicEditableListComponent<T extends ITimedChange = ITimedChange> implements OnChanges {
  elementRef = inject(ElementRef);

  @Input() isEditing = false;

  @Input() label!: string;
  @Input() valueType: 'string' | 'number' = 'string';

  @Input() value: T[] = [];
  @Input() valueDb: T[] | undefined = [];

  @Output() valueChange: EventEmitter<T[]> = new EventEmitter();

  public isDirty = false;

  constructor() {
    addIcons({ removeOutline, addOutline });
  }

  ngOnChanges() {
    this.isDirty = this.isChanged;
  }

  onFieldChange() {
    this.isDirty = this.isChanged
    this.value = this.value.map(row => ({
      ...row,
      value: this.valueType === 'string'
        ? SanitizeSscInput(String(row.value ?? ""))
        : row.value
    })); // the sanitized value (string or null) replaces the field value

    this.valueChange.emit(this.value);
  }

  private normalize(v: unknown, type: 'string' | 'number'): string {
    if (v === undefined || v === null) return "";
    if (type === 'number') return String(Number(v));
    return String(v).trim();
  }

  isRowChanged(i: number): boolean {
    if (!this.isEditing) return false;

    const row = this.value[i];
    const rowDb = this.valueDb?.[i];
    if (!rowDb) return true;

    return (
      this.normalize(row.time, 'number') !== this.normalize(rowDb.time, 'number') ||
      this.normalize(row.value, this.valueType) !== this.normalize(rowDb.value, this.valueType)
    );
  }

  get isChanged(): boolean {
    if (!this.isEditing) return false;
    if (this.value.length !== this.valueDb?.length) return true;
    return this.value.some((_, i) => this.isRowChanged(i));
  }

  addRow() {
    this.value.push({
      time: 0,
      value: this.valueType === 'number' ? 0 : ''
    } as T);

    this.isDirty = this.isChanged
    this.valueChange.emit(this.value);
  }

  removeRow(i: number) {
    this.value.splice(i, 1);

    this.isDirty = this.isChanged
    this.valueChange.emit(this.value);
  }

  formatRow(row: T | undefined): string {
    if (!row) return '';
    return Object.entries(row)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
  }

}
