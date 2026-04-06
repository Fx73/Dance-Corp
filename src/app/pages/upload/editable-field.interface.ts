import { ElementRef, InjectionToken } from "@angular/core";

export interface IMusicEditableField {
    elementRef: ElementRef;

    label: string;
    type: 'string' | 'number';
    isDirty: boolean;
}

export const MUSIC_EDITABLE_FIELD_TOKEN = new InjectionToken<IMusicEditableField>('MUSIC_EDITABLE_FIELD_TOKEN');