import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import {
  HelpCenterDocumentDTO,
  HelpCenterDocumentListItemDTO,
} from './documentation-dto';
import {
  HelpCenterDocument,
  HelpCenterDocumentListItem,
} from './documentation.interface';
import { getLocalizedName } from '@shared/utils/localization.util';
import { ensureArray } from '@shared/utils/array.util';

export const HELP_CENTER_DOCUMENTATION_MAP_FROM_DTO = new (class {
  DocumentDetail(dto: HelpCenterDocumentDTO): HelpCenterDocument {
    const { category } = dto;
    return {
      id: dto.id,
      title: dto.title,
      isPrivate: dto.isPrivate,
      supportCategoryId: dto.supportCategoryId,
      content: dto.content,
      status: dto.status,
      language: dto.language,
      articleType: dto.articleType,
      createdBy: COMMON_MAP_FROM_DTO.createdBy(dto.createdBy),
      category: {
        id: category.id,
        displayName: getLocalizedName({
          arName: category.categoryArName,
          enName: category.categoryEnName,
        }),
        supportTypeId: category.supportTypeId,
      },
      attachments: ensureArray(dto.attachments),
    };
  }

  documentListItem(
    dto: HelpCenterDocumentListItemDTO[],
  ): HelpCenterDocumentListItem[] {
    return ensureArray(dto).map((item) => ({
      id: item.id,
      displayName: getLocalizedName({
        arName: item.categoryArName,
        enName: item.categoryEnName,
      }),
      articles: ensureArray(item.articles),
    }));
  }
})();
