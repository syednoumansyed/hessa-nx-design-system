import { ObjId } from '@shared/interfaces/common.interface';

export interface CustomFieldLinkedCategory {
  id: number;
  displayName: string;
}

export interface CustomField {
  id: ObjId;
  labelDisplayName: string;
  descriptionDisplayName: string;
  isRequired: boolean;
  linkedCategories: CustomFieldLinkedCategory[];
  isDraft?: boolean;
  enLabel?: string;
  arLabel?: string;
  enDescription?: string;
  arDescription?: string;
}

export interface CreateCustomFieldPayload {
  arLabel: string;
  enLabel: string;
  arDescription?: string;
  enDescription?: string;
  required: boolean;
}
