import { Component, EventEmitter, Input, Output } from '@angular/core';
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


  constructor() {
    addIcons({ removeOutline, addOutline });
  }

  @Output() valueChange = new EventEmitter<any[]>();
  onFieldChange() {
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




  addRow() {
    this.value.push({
      time: 0,
      value: this.valueType === 'number' ? 0 : ''
    });
    this.valueChange.emit(this.value);
  }


  removeRow(i: number) {
    this.value.splice(i, 1);
    this.valueChange.emit(this.value);
  }

  formatRow(row: any): string {
    if (!row) return '';
    return Object.entries(row)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
  }

}
