import { ensureArray } from '@shared/utils/array.util';
import { getLocalizedName } from '@shared/utils/localization.util';
import { CustomFieldDTO, CustomFieldSupportTypeDTO } from './custom-field.dto';
import {
  CustomField,
  CustomFieldLinkedCategory,
} from './custom-field.interface';

const resolveLinkedCategories = (
  supportTypes: CustomFieldSupportTypeDTO[],
): CustomFieldLinkedCategory[] => {
  return ensureArray(supportTypes).map((st) => ({
    id: st.id,
    displayName: getLocalizedName({ enName: st.enName, arName: st.arName }),
  }));
};

export const CUSTOM_FIELD_MAP_FROM_DTO = new (class {
  customField(dto: CustomFieldDTO): CustomField {
    return {
      id: dto.id,
      labelDisplayName: getLocalizedName({
        enName: dto.enLabel,
        arName: dto.arLabel,
      }),
      descriptionDisplayName: getLocalizedName({
        enName: dto.enDescription,
        arName: dto.arDescription,
      }),
      isRequired: dto.required,
      linkedCategories: resolveLinkedCategories(dto.supportTypes),
    };
  }

  customFields(dtos: CustomFieldDTO[] | null): CustomField[] {
    return ensureArray(dtos).map((dto) => this.customField(dto));
  }
})();
