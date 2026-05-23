import { SupportCategoryDTO } from './support-category.dto';
import {
  SupportCategory,
  SupportSubcategory,
} from './support-category.interface';
import { getLocalizedName } from '@shared/utils/localization.util';

export const SUPPORT_CATEGORY_DTO_TRANSFORM = {
  /**
   * Transform a single category DTO to the app interface.
   * Only includes categories where isForTicket is true.
   */
  supportCategory(dto: SupportCategoryDTO): SupportCategory {
    const localizedDescription = getLocalizedName({
      enName: dto.enDescription,
      arName: dto.arDescription,
    });

    return {
      id: dto.id,
      displayName: getLocalizedName({ enName: dto.enName, arName: dto.arName }),
      description: localizedDescription ? localizedDescription : null,
      icon: dto.icon ?? null,
      allowPrivateRequest: dto.allowPrivateRequest ?? false,
    };
  },

  /**
   * Transform multiple category DTOs to the app interface.
   * Filters to only include categories where isForTicket is true.
   */
  supportCategories(dtos: readonly SupportCategoryDTO[]): SupportCategory[] {
    return dtos
      .filter((dto) => dto.isForTicket === true)
      .map((dto) => this.supportCategory(dto));
  },

  /**
   * Transform a single subcategory DTO to the app interface.
   */
  supportSubcategory(dto: SupportCategoryDTO): SupportSubcategory {
    const localizedDescription = getLocalizedName({
      enName: dto.enDescription,
      arName: dto.arDescription,
    });

    return {
      id: dto.id,
      displayName: getLocalizedName({ enName: dto.enName, arName: dto.arName }),
      description: localizedDescription ? localizedDescription : null,
      icon: dto.icon ?? null,
      supportTypeId: dto.supportTypeId ?? 0,
      allowPrivateRequest: dto.allowPrivateRequest ?? false,
    };
  },

  /**
   * Transform multiple subcategory DTOs to the app interface.
   */
  supportSubcategories(
    dtos: readonly SupportCategoryDTO[],
  ): SupportSubcategory[] {
    return dtos.map((dto) => this.supportSubcategory(dto));
  },
};
