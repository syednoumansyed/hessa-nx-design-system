import { DsIcon } from '@ds/icon/icon.component';

export type DsFeedbackType =
  | 'success'
  | 'error'
  | 'warning'
  | 'exciting'
  | 'info'
  | 'question';

export interface DsFeedback {
  type: DsFeedbackType;
  modalTitle: string;
  modalMessage?: string;
  primaryBtnStr?: string;
  secondaryBtnStr?: string;
  icon?: DsIcon;
  /** Stack buttons vertically (primary on top). Useful when button labels are long. */
  stackButtons?: boolean;
}
