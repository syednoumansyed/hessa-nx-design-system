import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import { VirtualClassroomDTO } from './vcr.dto';
import { VirtualClassroom } from './vcr.interface';
import { ensureArray } from '@shared/utils/array.util';

export const VCR_MAP_FROM_DTO = new (class {
  virtualClassroom(dto: VirtualClassroomDTO): VirtualClassroom {
    return {
      id: dto.id,
      subjectId: dto.subjectId,
      classId: dto.classId,
      serviceProvider: dto.serviceProvider,
      meetingLink: dto.meetingLink,
      repeatOption: dto.repeatOption,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      hasUpcomingSession: dto.hasUpcomingSession,
      hasPastSession: dto.hasPastSession,
      nextVirtualClassroomLectureId: dto.nextVirtualClassroomLectureId,
      subject: COMMON_MAP_FROM_DTO.nameIdentifiable(dto.subject),
      class: COMMON_MAP_FROM_DTO.nameIdentifiable(dto.class),
      level: COMMON_MAP_FROM_DTO.nameIdentifiable(dto.level),
      personnel: COMMON_MAP_FROM_DTO.fullNameIdentifiable(dto.personnel),
      lectures: ensureArray(dto.lectures),
    };
  }

  virtualClassrooms(dtos: VirtualClassroomDTO[]): VirtualClassroom[] {
    return ensureArray(dtos).map((dto) => this.virtualClassroom(dto));
  }
})();
