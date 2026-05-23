import { IControl } from '@shared/components/form-control-generator/form-control-generator.component';

export interface JournalFieldDTO {
  sections: FieldSection[];
}

export interface FieldSection {
  title: string; // e.g. "api.journal.title.my_distinction"
  key: string; // e.g. "distinction"
  type?: string; // optional, because the JSON doesn't show 'type' for sections
  hideTitle?: boolean;
  items?: FieldItem[];
}

export interface FieldItem {
  title: string; // e.g. "api.journal.title.my_meal"
  key: string; // e.g. "meal"
  required?: boolean;
  type: string; // e.g. "TEXT_AREA" | "CHECKBOX" | "INPUT", etc.
  items?: FieldSubItem[];
}

export interface FieldSubItem {
  title: string; // e.g. "api.journal.text.all"
  key: string; // e.g. "api.journal.text.all"
}

export interface SectionControl {
  sectionTitle: string;
  sectionKey: string;
  hideTitle: boolean;
  controls: IControl[];
}
