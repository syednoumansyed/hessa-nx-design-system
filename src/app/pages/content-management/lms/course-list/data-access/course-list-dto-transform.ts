import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import { StudentCourseDTO, StudentCourseTodoDTO } from './course-list.dto';
import { StudentCourse, StudentCourseTodo } from './course-list.interface';
import { ensureArray } from '@shared/utils/array.util';

export const LMS_COURSE_LIST_MAP_FROM_DTO = new (class {
  studentCourse(dto: StudentCourseDTO): StudentCourse {
    return {
      id: dto.id,
      subject: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.subject),
      attachments: ensureArray(dto.attachments),
      imageUrl: dto.imageUrl,
      weeksCount: dto.weeksCount,
      currentWeekNumber: dto.currentWeekNumber,
      missedCount: dto.missedCount,
      todoCount: dto.todoCount,
      courseProgressPercentage: dto.courseProgressPercentage,
      courseProgressStatus: dto.courseProgressStatus,
    };
  }

  studentCourses(dto: StudentCourseDTO[]): StudentCourse[] {
    return ensureArray(dto).map((course) => this.studentCourse(course));
  }

  studentCourseTodo(dto: StudentCourseTodoDTO): StudentCourseTodo {
    return {
      id: dto.id,
      type: dto.type,
      title: dto.title,
      dueDate: dto.dueDate,
      imageUrl: dto.imageUrl,
      attachments: ensureArray(dto.attachments),
      topic: dto.topic,
      subject: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.subject),
      courseId: dto.courseId,
      workItemType: dto.workItemType,
      dueString: dto.dueString,
      dueColor: dto.dueColor,
      isMissed: dto.isMissed,
    };
  }

  studentCoursesTodo(dto: StudentCourseTodoDTO[]): StudentCourseTodo[] {
    return ensureArray(dto).map((todo) => this.studentCourseTodo(todo));
  }
})();
