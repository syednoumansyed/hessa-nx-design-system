import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import {
  ReportCardListDTO,
  StudentReportCardDTO,
  StudentReportCardPreviewDTO,
} from './report-card-processing.dto';
import {
  ReportCardList,
  StudentReportCard,
  StudentReportCardPreview,
} from './report-card-processing.interface';
import { ensureArray } from '@shared/utils/array.util';
import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';

export const PROCESSING_REPORT_CARD_MAP_FROM_DTO = new (class {
  reportCardListItem(dto: ReportCardListDTO): ReportCardList {
    return {
      level: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.level),
      class: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.class),
      semester: dto.semester,
      academicYear: dto.academicYear,
      school: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.school),
      coursesClasses: dto.coursesClasses,
      reportCard: dto.reportCard,
    };
  }
  reportCardList(dto: ReportCardListDTO[]): ReportCardList[] {
    return ensureArray(dto).map((item) => this.reportCardListItem(item));
  }

  studentReportCard(dto: StudentReportCardDTO): StudentReportCard {
    const { student } = dto;
    return {
      student: {
        id: student.id,
        displayName: getLocalizedFullName(student),
        userId: student.userId,
        nationalId: student.nationalId,
        displayPhoneNumber: `${student.countryCode} ${student.phoneNumber}`,
      },
      academicYear: dto.academicYear,
      semester: dto.semester,
      class: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.class),
      level: COMMON_MAP_FROM_DTO.displayNameIdentifiable(dto.level),
      reportCard: dto.reportCard,
      reportCardStudent: dto.reportCardStudent,
      lastEntry: dto.lastEntry,
    };
  }
  studentReportCards(dto: StudentReportCardDTO[]): StudentReportCard[] {
    return ensureArray(dto).map((item) => this.studentReportCard(item));
  }

  studentReportCardPreview(
    dto: StudentReportCardPreviewDTO[],
  ): StudentReportCardPreview[] {
    return ensureArray(dto).map((item) => ({
      id: item.id,
      displayName: getLocalizedName(item),
      columns: ensureArray(item.columns).map((col) => ({
        ...col,
        displayStatus:
          col.status === 'NEW'
            ? 'global.new.txt'
            : col.status === 'UPDATED'
              ? 'new.update'
              : '',
      })),
    }));
  }
})();
