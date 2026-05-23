import { ensureArray } from '@shared/utils/array.util';
import { COMMON_MAP_FROM_DTO } from '../common';
import { TimePeriodDetailDTO, TimePeriodDTO } from './time-period.dto';
import { TimePeriod, TimePeriodDetail } from './time-period.interface';

export const TIME_PERIOD_MAP_FROM_DTO = new (class {
  timePeriod(dto: TimePeriodDetailDTO): TimePeriodDetail {
    return {
      id: dto.id,
      schoolLevelId: dto.schoolLevelId,
      company: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.company),
      campus: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.campus),
      school: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.school),
      days: ensureArray(dto.days),
      academicYear: dto.academicYear,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      level: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.level),
      class: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.class),
      periods: ensureArray(dto.periods),
    };
  }

  timePeriodList(dtos: TimePeriodDTO[] | null): TimePeriod[] {
    return ensureArray(dtos).map((dto) => {
      return {
        id: dto.id,
        schoolLevelId: dto.schoolLevelId,
        academicYear: dto.academicYear,
        level: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.level),
        class: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.class),
        days: ensureArray(dto.days),
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        isDeletable: dto.isDeletable,
      };
    });
  }
})();
