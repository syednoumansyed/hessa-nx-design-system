import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import { CourseManagementDTO, CourseSubjectDTO } from './course-management.dto';
import { CourseManagement, CourseSubject } from './course-management.interface';
import { ensureArray } from '@shared/utils/array.util';
import { getLocalizedName } from '@shared/utils/localization.util';

export const COURSE_MANAGEMENT_MAP_FROM_DTO = new (class {
  courseManagement(dto: CourseManagementDTO): CourseManagement {
    return {
      id: dto.id,
      subject: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.subject),
      personnel: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.personnel),
      lectures: ensureArray(dto.lectures),
      academicYear: dto.academicYear,
      company: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.company),
      campus: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.campus),
      school: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.school),
      level: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.level),
      class: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.class),
      status: dto.status,
      creditHour: dto.creditHour,
      hasContents: dto.hasContents,
    };
  }

  coursesManagement(dto: CourseManagementDTO[]): CourseManagement[] {
    return ensureArray(dto).map((course) => this.courseManagement(course));
  }

  subjects(dto: CourseSubjectDTO[]): CourseSubject[] {
    return ensureArray(dto).map((subject) => this.subject(subject));
  }

  subject(dto: CourseSubjectDTO): CourseSubject {
    return {
      id: dto.id,
      displayName: getLocalizedName(dto),
      displayedValue: getLocalizedName(dto),
      value: dto.id,
    };
  }
})();
