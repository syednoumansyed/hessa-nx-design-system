import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import { JournalDTO } from './journal.dto';
import { Journal } from './journal.interface';
import { ensureArray } from '@shared/utils/array.util';

export const JOURNAL_MAP_FROM_DTO = new (class {
  journal(dto: JournalDTO): Journal {
    return {
      id: dto.id,
      type: dto.type,
      journalDate: dto.journalDate,
      semesterId: dto.semesterId,
      journalEndDate: dto.journalEndDate,
      semesterName: dto.semesterName,
      classId: dto.classId,
      classDisplayName: getLocalizedName({
        arName: dto.classArName,
        enName: dto.classEnName,
      }),
      levelId: dto.levelId,
      levelDisplayName: getLocalizedName({
        arName: dto.levelArName,
        enName: dto.levelEnName,
      }),
      roleId: dto.roleId,
      roleDisplayName: getLocalizedName({
        arName: dto.roleArName,
        enName: dto.roleEnName,
      }),
      guardianId: dto.guardianId,
      studentId: dto.studentId,
      displayName: getLocalizedFullName(dto),
      userId: dto.userId,
      nationalId: dto.nationalId,
      displayPhoneNumber: `${dto.countryCode || ''} ${dto.phoneNumber || ''}`,
      gender: dto.gender,
      dateOfBirth: dto.dateOfBirth,
      pioneerId: dto.pioneerId,
      registrationDate: dto.registrationDate,
      viewedByGuardian: dto.viewedByGuardian,
      publishDate: dto.publishDate,
      status: dto.status,
      acknowledgementComment: dto.acknowledgementComment,
      updatedAt: dto.updatedAt,
      createdAt: dto.createdAt,
      taskDone: dto.taskDone,
      arabicTeacherNote: dto.arabicTeacherNote,
      scienceTeacherNote: dto.scienceTeacherNote,
      englishTeacherNote: dto.englishTeacherNote,
      healthAndCareTeacherNote: dto.healthAndCareTeacherNote,
      islamicTeacherNote: dto.islamicTeacherNote,
      meal: ensureArray(dto.meal),
      lunch: ensureArray(dto.lunch),
      snack: ensureArray(dto.snack),
      skillClubs: ensureArray(dto.skillClubs),
      healthAndCare: dto.healthAndCare,
      guardianDisplayName: getLocalizedName({
        arName: dto.guardianArFullName,
        enName: dto.guardianEnFullName,
      }),
      needGuardianAttention: dto.needGuardianAttention,
      arabicTeacherDisplayName: getLocalizedName({
        arName: dto.arabicTeacherArFullName,
        enName: dto.arabicTeacherEnFullName,
      }),
      englishTeacherDisplayName: getLocalizedName({
        arName: dto.englishTeacherArFullName,
        enName: dto.englishTeacherEnFullName,
      }),
      scienceTeacherDisplayName: getLocalizedName({
        arName: dto.scienceTeacherArFullName,
        enName: dto.scienceTeacherEnFullName,
      }),
      healthAndCareTeacherDisplayName: getLocalizedName({
        arName: dto.healthAndCareTeacherArFullName,
        enName: dto.healthAndCareTeacherEnFullName,
      }),
      islamicTeacherDisplayName: getLocalizedName({
        arName: dto.islamicTeacherArFullName,
        enName: dto.islamicTeacherEnFullName,
      }),
    };
  }

  journals(dto: JournalDTO[]): Journal[] {
    return ensureArray(dto).map((journal) => this.journal(journal));
  }
})();
