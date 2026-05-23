import { ContentPublishDTO } from './content-publish.dto';
import { ContentPublish } from './content-publish.interface';
import { ensureArray } from '@shared/utils/array.util';
import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';

export const CONTENT_PUBLISH_MAP_FROM_DTO = new (class {
  contentPublish(dto: ContentPublishDTO): ContentPublish {
    const { selected, available } = dto;
    return {
      selected: {
        classes: COMMON_MAP_FROM_DTO.displayNameIdentifiables(
          ensureArray(selected.classes),
        ),
        students: COMMON_MAP_FROM_DTO.displayNameIdentifiables(
          ensureArray(selected.students),
        ),
        exam: selected.exam ?? null,
        attachment: selected.attachment ?? null,
        assignment: selected.assignment ?? null,
      },
      available: {
        classes: COMMON_MAP_FROM_DTO.displayNameIdentifiables(
          ensureArray(available.classes),
        ),
        students: COMMON_MAP_FROM_DTO.displayNameIdentifiables(
          ensureArray(available.students),
        ),
      },
    };
  }
})();
