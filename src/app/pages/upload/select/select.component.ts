import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from "@ionic/angular/standalone";

@Component({
  selector: 'music-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  standalone: true,
  imports: [IonLabel, IonItem, IonSelect, IonSelectOption]
})
export class MusicSelectComponent {
  @Input() label!: string;
  @Input() value!: any;
  @Input() valueDb: any = null;
  @Input() isEditing = false;

  @Input() options: any[] = [];

  @Output() valueChange = new EventEmitter<any>();

  public isDirty = false;

  constructor(public elementRef: ElementRef) { }

  ngOnChanges() {
    this.isDirty = this.isEditing && this.normalize(this.value) !== this.normalize(this.valueDb);
  }

  onSelectChange(ev: any) {
    this.isDirty = this.isEditing && this.normalize(ev.detail.value) !== this.normalize(this.valueDb);
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
