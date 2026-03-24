import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { IonButton, IonIcon, IonInput, IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { addOutline, removeOutline } from 'ionicons/icons';

import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';

@Component({
  selector: 'music-editable-list',
  templateUrl: './editable-list.component.html',
  styleUrls: ['./editable-list.component.scss'],
  standalone: true,
  imports: [IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon, FormsModule]
})
export class MusicEditableListComponent {
  @Input() isEditing = false;

  @Input() label!: string;
  @Input() valueType: 'string' | 'number' = 'string';

  @Input() value: any[] = [];
  @Input() valueDb: any[] | undefined = [];

  @Output() valueChange = new EventEmitter<any[]>();

  public isDirty = false;

  constructor(public elementRef: ElementRef) {
    addIcons({ removeOutline, addOutline });
  }

  ngOnChanges() {
    this.isDirty = this.isChanged;
  }

  onFieldChange() {
    this.isDirty = this.isChanged
    this.valueChange.emit(this.value);
  }
  private normalize(v: any, type: 'string' | 'number'): string {
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
    });

    this.isDirty = this.isChanged
    this.valueChange.emit(this.value);
  }


  removeRow(i: number) {
    this.value.splice(i, 1);

    this.isDirty = this.isChanged
    this.valueChange.emit(this.value);
  }

  formatRow(row: any): string {
    if (!row) return '';
    return Object.entries(row)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
  }

}
