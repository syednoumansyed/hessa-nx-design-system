import { ObjId } from '@shared/interfaces/common.interface';
import { CustomField } from '../../data-access/custom-field.interface';

export type ManageCategoryView = 'category' | 'search-fields' | 'add-field';

export { CustomField };

export interface CategoryFormData {
  enTitle: string;
  arTitle: string;
  enDescription: string;
  arDescription: string;
  // icon: string; // SKIPPED - will add later
  isForTicket: boolean;
  isForArticle: boolean;
  visibleForGuardiansStudents: boolean;
  allowPrivateRequest: boolean;
  customFieldIds: ObjId[];
}

export interface ManageCategoryDialogInput {
  isEdit: boolean;
  categoryId?: ObjId;
  categoryData?: Partial<CategoryFormData>;
  linkedCustomFields?: CustomField[];
  closeModal: () => void;
  refreshCategories: () => void;
}
