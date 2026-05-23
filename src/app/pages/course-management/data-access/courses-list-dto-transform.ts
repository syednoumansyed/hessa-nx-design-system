import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import { CourseSubjectListItemDTO } from './courses-list.dto';
import { CourseSubjectListItem } from './courses-list.interface';
import { ensureArray } from '@shared/utils/array.util';
import { getLocalizedName } from '@shared/utils/localization.util';

export const COURSE_LIST_MAP_FROM_DTO = new (class {
  courseListItem(dto: CourseSubjectListItemDTO): CourseSubjectListItem {
    return {
      id: dto.id,
      courseClass: dto.courseClass,
      course: dto.course,
      personnel: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.personnel),
      coPersonnel: dto.coPersonnel
        ? COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.coPersonnel)
        : null,
      subject: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.subject),
      attachments: dto.attachments,
      displayClasses: ensureArray(dto.classes)
        .map((cls) => getLocalizedName(cls))
        .join(', '),
      level: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.level),
      topicsCount: dto.topicsCount,
      videosCount: dto.videosCount,
      attachmentsCount: dto.attachmentsCount,
      assignmentsCount: dto.assignmentsCount,
      examsCount: dto.examsCount,
      viewedVideoCount: dto.viewedVideoCount ?? 0,
      viewedAttachmentCount: dto.viewedAttachmentCount ?? 0,
      viewedExamCount: dto.viewedExamCount ?? 0,
      viewedAssignmentCount: dto.viewedAssignmentCount ?? 0,
    };
  }

  courseListItems(dto: CourseSubjectListItemDTO[]): CourseSubjectListItem[] {
    return ensureArray(dto).map((item) => this.courseListItem(item));
  }
})();
