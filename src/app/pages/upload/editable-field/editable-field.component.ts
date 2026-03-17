import { Component, EventEmitter, Input, Output } from "@angular/core";
import { IonInput, IonItem, IonLabel } from "@ionic/angular/standalone";

@Component({
  selector: 'music-editable-field',
  templateUrl: './editable-field.component.html',
  styleUrls: ['./editable-field.component.scss'],
  standalone: true,
  imports: [IonItem, IonLabel, IonInput]
})
export class MusicEditableFieldComponent {
  @Input() isEditing = false;

  @Input() label!: string;
  @Input() type: 'string' | 'number' = 'string';

  @Input() value!: any;
  @Input() valueDb: any = null;

  @Output() valueChange = new EventEmitter<any>();
  onInputChange(ev: any) {
    this.valueChange.emit(ev.detail.value);
  }

  get isChanged(): boolean {
    return this.isEditing && this.normalize(this.value) !== this.normalize(this.valueDb);
  }

  private normalize(v: any): string {
    if (v === undefined || v === null) return "";
    return String(v).trim();
  }

}
