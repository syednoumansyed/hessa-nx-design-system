import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import { CourseDetailForStudentDTO } from './course-detail.dto';
import { CourseDetailForStudent } from './course-detail.interface';
import { ensureArray } from '@shared/utils/array.util';

export const LMS_COURSE_DETAIL_MAP_FROM_DTO = new (class {
  courseDetailForStudent(
    dto: CourseDetailForStudentDTO,
  ): CourseDetailForStudent {
    return {
      id: dto.id,
      personnel: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.personnel),
      subject: COMMON_MAP_FROM_DTO.nameIdentifiable(dto.subject),
      classesDisplayName: ensureArray(dto.classes)
        .map((cls) => COMMON_MAP_FROM_DTO.nameIdentifiable(cls).displayName)
        .join(', '),
      course: {
        status: dto.course.status,
      },
      level: COMMON_MAP_FROM_DTO.nameIdentifiable(dto.level),
      attachments: ensureArray(dto.attachments),
      exams: ensureArray(dto.exams),
      videos: ensureArray(dto.videos),
      otherAttachments: ensureArray(dto.otherAttachments),
      assignments: ensureArray(dto.assignments),
      currentWeek: dto.currentWeek,
      currentWeekNumber: dto.currentWeekNumber,
      topicsCount: dto.topicsCount,
      weeksCount: dto.weeksCount,
      videosCount: dto.videosCount,
      attachmentsCount: dto.attachmentsCount,
      assignmentsCount: dto.assignmentsCount,
      examsCount: dto.examsCount,
      viewedVideoCount: dto.viewedVideoCount,
      viewedAttachmentCount: dto.viewedAttachmentCount,
      viewedAssignmentCount: dto.viewedAssignmentCount,
      viewedExamCount: dto.viewedExamCount,
      missedCount: dto.missedCount,
      todoCount: dto.todoCount,
      weeksCompletionPercentage: dto.weeksCompletionPercentage,
      courseProgressPercentage: dto.courseProgressPercentage,
      courseProgressStatus: dto.courseProgressStatus,
      videoProgressPercentage: dto.videoProgressPercentage,
      attachmentProgressPercentage: dto.attachmentProgressPercentage,
      assignmentProgressPercentage: dto.assignmentProgressPercentage,
      examProgressPercentage: dto.examProgressPercentage,
      topics: ensureArray(dto.topics),
      weeks: ensureArray(dto.weeks),
    };
  }
  coursesDetailForStudent(
    dto: CourseDetailForStudentDTO[],
  ): CourseDetailForStudent[] {
    return ensureArray(dto).map((item) => this.courseDetailForStudent(item));
  }
})();
