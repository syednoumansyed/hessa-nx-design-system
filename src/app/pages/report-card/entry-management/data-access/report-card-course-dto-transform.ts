import { ensureArray } from '@shared/utils/array.util';
import {
  ColumnSubjectEntryByIdResponseDTO,
  ColumnSubjectEntryDTO,
  ReportCardCourseDTO,
} from './report-card-course.dto';
import {
  ColumnSubjectEntry,
  ColumnSubjectEntryByIdResponse,
  ReportCardCourse,
} from './report-card-course.interface';
import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import { getLocalizedFullName } from '@shared/utils/localization.util';

export const REPORT_CARD_ENTRY_MAP_FROM_DTO = new (class {
  reportCardCourses(dto: ReportCardCourseDTO[]): ReportCardCourse[] {
    return ensureArray(dto).map((item) => ({
      class: COMMON_MAP_FROM_DTO.displayNameIdentifiable(item.class),
      level: COMMON_MAP_FROM_DTO.displayNameIdentifiable(item.level),
      subject: COMMON_MAP_FROM_DTO.displayNameIdentifiable(item.subject),
      school: COMMON_MAP_FROM_DTO.displayNameIdentifiable(item.school),
      course: item.course,
      academicYear: {
        id: item.academicYear.id,
        displayName: item.academicYear.name,
      },
      semesters: ensureArray(item.semester).map((semester) => ({
        id: semester.id,
        displayName: semester.name,
      })),
      lastEntry: ensureArray(item.lastEntry),
      reportCard: item.reportCard,
    }));
  }

  columnSubjectEntryById(
    dto: ColumnSubjectEntryByIdResponseDTO,
  ): ColumnSubjectEntryByIdResponse {
    return {
      id: dto.id,
      title: dto.title,
      reportCardColumnSubjectId: dto.reportCardColumnSubjectId,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      isMarksSaved: dto.isMarksSaved,
      studentsMarks: ensureArray(dto.studentsMarks).map((student) => ({
        studentId: student.studentId,
        displayName: getLocalizedFullName(student),
        marks: student.marks,
      })),
    };
  }

  columnSubjectEntries(dto: ColumnSubjectEntryDTO[]): ColumnSubjectEntry[] {
    return ensureArray(dto).map((item) => ({
      id: item.id,
      title: item.title,
      reportCardColumnSubjectId: item.reportCardColumnSubjectId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isMarksSaved: item.isMarksSaved,
    }));
  }
})();
