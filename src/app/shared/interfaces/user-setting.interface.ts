import { Language } from '@shared/enums';

export interface UserSettingPayload {
  selectedTargetId?: number;
  selectedTargetType?: string;
  selectedAcademicYearId?: number;
  selectedLanguage?: Language;
  clearStructureSelection?: boolean;
}
