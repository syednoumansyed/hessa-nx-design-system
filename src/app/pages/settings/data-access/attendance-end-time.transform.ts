import { getLocalizedName } from '@shared/utils/localization.util';
import { ExtendedEndTimeDTO } from './attendance-end-time.dto';
import { ExtendedEndTime } from './attendance-end-time.interface';
import { ensureArray } from '@shared/utils/array.util';

export const ATTENDANCE_END_TIME_MAP_FROM_DTO = new (class {
  extendedEndTime(dto: ExtendedEndTimeDTO): ExtendedEndTime {
    return {
      id: dto.id,
      type: dto.type,
      school: {
        displayName: getLocalizedName(dto.school),
      },
      startDateTime: dto.startDateTime,
      endDateTime: dto.endDateTime,
      endTime: dto.endTime,
    };
  }

  extendedEndTimeList(dtos: ExtendedEndTimeDTO[] | null): ExtendedEndTime[] {
    return ensureArray(dtos).map((dto) => this.extendedEndTime(dto));
  }
})();
