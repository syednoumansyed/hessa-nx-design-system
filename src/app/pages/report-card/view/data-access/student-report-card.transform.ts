import { ensureArray } from '@shared/utils/array.util';
import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import {
  ReportCardClassDTO,
  ReportCardLevelDTO,
  ReportCardNameDTO,
  StudentReportCardResponseDTO,
} from './student-report-card.dto';
import {
  ReportCardLocalizedEntity,
  StudentReportCardEntries,
  StudentReportCardEntry,
} from './student-report-card.interface';

const mapLocalizedEntity = (
  dto: ReportCardNameDTO | null | undefined,
): ReportCardLocalizedEntity => ({
  id: dto?.id ?? 0,
  displayName: getLocalizedName({
    arName: dto?.arName ?? null,
    enName: dto?.enName ?? null,
  }),
});

export function mapStudentReportCard(
  dto: StudentReportCardResponseDTO,
): StudentReportCardEntry {
  const classEntity = mapLocalizedEntity(dto.class as ReportCardClassDTO);
  const levelEntity = mapLocalizedEntity(dto.level as ReportCardLevelDTO);

  return {
    student: {
      id: dto.student.id,
      dateOfBirth: dto.student.dateOfBirth,
      pioneerId: dto.student.pioneerId,
      registrationDate: dto.student.registrationDate,
      userId: dto.student.userId,
      displayFullName: getLocalizedFullName({
        arFullName: dto.student.arFullName ?? null,
        enFullName: dto.student.enFullName ?? null,
      }),
      phoneNumber: dto.student.phoneNumber,
      nationalId: dto.student.nationalId,
      countryCode: dto.student.countryCode,
      gender: dto.student.gender,
      profileColor: dto.student.profileColor,
      nationality: dto.student.nationality
        ? mapLocalizedEntity(dto.student.nationality)
        : null,
      passportNumber: dto.student.passportNumber,
    },
    academicYear: dto.academicYear,
    semester: ensureArray(dto.semester),
    class: classEntity,
    level: levelEntity,
    reportCard: dto.reportCard,
    reportCardStudent: dto.reportCardStudent,
    lastEntryAt: ensureArray(dto.lastEntry)[0]?.createdAt ?? null,
  };
}

export function mapStudentReportCards(
  dtos: StudentReportCardResponseDTO[] | null | undefined,
): StudentReportCardEntries {
  return ensureArray(dtos).map((dto) => mapStudentReportCard(dto));
}
