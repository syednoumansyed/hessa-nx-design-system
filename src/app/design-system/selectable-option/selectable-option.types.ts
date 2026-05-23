export type SelectableOptionState =
  | 'active'
  | 'disabled'
  | 'select-correct'
  | 'unselected-correct'
  | 'select-incorrect'
  | 'default';

export interface SelectableOptionConfig {
  value: string | number;
  display: string;
}

export type SelectableOptionGroupMode = 'view' | 'attempt';

export interface SelectableOptionGroupConfig {
  options: SelectableOptionConfig[];
  mode: SelectableOptionGroupMode;
  correctOptionValue: string | number | null;
  revealAnswer: boolean;
}

export enum SelectableOptionVisualState {
  Active = 'active',
  Default = 'default',
  SelectCorrect = 'selectCorrect',
  UnselectedCorrect = 'unselectedCorrect',
  SelectIncorrect = 'selectIncorrect',
  Disabled = 'disabled',
}
