import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import {
  AcademicYearDTO,
  StudentCampusDTO,
  StudentClassDTO,
  StudentCompanyDTO,
  StudentDTO,
  StudentGuardianDTO,
  StudentLevelDTO,
  StudentSchoolDTO,
} from './student-dto';
import { Student, StudentGuardian } from './student.interface';
import { UserType } from '@shared/enums';
import { ensureArray } from '@shared/utils/array.util';
import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation/common';
import { getFirstObjectOrNull } from '@shared/utils/get-first-object-or-null.util';

export const STUDENT_MAP_FROM_DTO = new (class {
  student(dto: StudentDTO): Student {
    // Take the first schoolStructure entry (active) and immediately transform its nested entities
    // so that company, campus, school, level, class, academicYear have { id, displayName } shape.
    const activeSchoolStructureRaw = dto.schoolStructure?.[0] || null;
    const activeSchoolStructure = activeSchoolStructureRaw
      ? {
          ...activeSchoolStructureRaw,
          company: STUDENT_MAP_FROM_DTO.company(
            activeSchoolStructureRaw.company,
          ),
          campus: STUDENT_MAP_FROM_DTO.campus(activeSchoolStructureRaw.campus),
          school: STUDENT_MAP_FROM_DTO.school(activeSchoolStructureRaw.school),
          level: STUDENT_MAP_FROM_DTO.level(activeSchoolStructureRaw.level),
          class: STUDENT_MAP_FROM_DTO.class(activeSchoolStructureRaw.class),
          academicYear: STUDENT_MAP_FROM_DTO.academicYear(
            activeSchoolStructureRaw.academicYear,
          ),
        }
      : null;
    const resolvedSchoolStructure = resolveSchoolStructure(dto);

    const hasActiveStructure = Boolean(dto.schoolStructure?.length);
    const hasSchoolLevelId = Boolean(dto.schoolLevelId);
    const hasClasses = Boolean(dto.classes?.length);

    let studentClassStatus: Student['studentClassStatus'] = null;
    if (hasActiveStructure) {
      studentClassStatus = 'ACTIVE';
    } else if (hasSchoolLevelId && hasClasses) {
      studentClassStatus = 'INACTIVE';
    } else {
      studentClassStatus = null;
    }

    const getStructureValue = (key: keyof ResolvedSchoolStructure) =>
      hasActiveStructure
        ? activeSchoolStructure?.[key]
        : resolvedSchoolStructure?.[key] || null;
    const mapEntitiesToNames = (
      entities?: { arName: string; enName: string }[],
    ): string =>
      entities?.map((entity) => getLocalizedName(entity)).join(', ') ?? '';
    const lastUserEvent = getFirstObjectOrNull(dto.userEvent);
    return {
      id: dto.id,
      arFullName: dto.arFullName,
      enFullName: dto.enFullName,
      profileColor: dto.profileColor,
      displayPreferredName: dto.preferredName ?? getLocalizedFullName(dto),
      preferredName: dto.preferredName,
      imageUrl: dto.imageUrl ?? null,
      displayName: getLocalizedFullName(dto),
      company: getStructureValue('company') as Student['company'],
      campus: getStructureValue('campus') as Student['campus'],
      school: getStructureValue('school') as Student['school'],
      level: getStructureValue('level') as Student['level'],
      class: activeSchoolStructure?.class ?? null,
      nationalityName: getLocalizedName(dto.nationality),
      nationalId: dto.nationalId,
      nationalityId: dto.nationalityId ?? null,
      phoneNumber: dto.phoneNumber ?? null,
      displayPhoneNumber:
        `${dto.countryCode ?? ''} ${dto.phoneNumber ?? ''}`.trim(),
      countryCode: dto.countryCode ?? null,
      dateOfBirth: dto.dateOfBirth,
      pioneerId: dto.pioneerId,
      passportNumber: dto.passportNumber,
      passportExpiryDate: dto.passportExpiryDate,
      registrationDate: dto.registrationDate,
      connectedGuardian: COMMON_MAP_FROM_DTO.connectedProfile(
        dto.connectedGuardian,
      ),
      connectedPersonnel: COMMON_MAP_FROM_DTO.connectedProfile(
        dto.connectedPersonnel,
      ),
      getAllCompaniesName: () => mapEntitiesToNames(dto.companies),
      getAllCampusesName: () => mapEntitiesToNames(dto.campuses),
      getAllSchoolsName: () => mapEntitiesToNames(dto.schools),
      getAllLevelsName: () => mapEntitiesToNames(dto.levels),
      getAllClassesName: () => mapEntitiesToNames(dto.classes),
      academicYear: activeSchoolStructure?.academicYear
        ? activeSchoolStructure.academicYear
        : ensureArray(dto.academicYears).length
          ? this.academicYear(dto.academicYears[0])
          : null,
      type: UserType.STUDENT,
      studentClassStatus,
      gender: dto.gender,
      guardians: this.guardians(dto.guardians),
      status: dto.status,
      userId: dto.userId,
      lastActive: lastUserEvent?.createdAt ?? null,
      updatedAt: dto.updatedAt ?? null,
      lastUserEvent: lastUserEvent,
      userStatuses: dto.userStatuses ?? null,
      createdBy: dto.createdBy
        ? COMMON_MAP_FROM_DTO.createdBy(dto.createdBy)
        : null,
      createdAt: dto.createdAt,
      statusData: dto.statusData
        ? {
            ...dto.statusData,
            createdBy: COMMON_MAP_FROM_DTO.createdBy(dto.statusData.createdBy),
          }
        : null,
      isPasswordSetup: dto.isPasswordSetup ?? false,
    };
  }

  students(dto: StudentDTO[] | null): Student[] {
    return ensureArray(dto).map((student) => this.student(student));
  }

  company(dto: StudentCompanyDTO | null): Student['company'] {
    return dto
      ? {
          id: dto.id,
          displayName: getLocalizedName(dto),
        }
      : null;
  }

  campus(dto: StudentCampusDTO | null): Student['campus'] {
    return dto
      ? {
          id: dto.id,
          displayName: getLocalizedName(dto),
        }
      : null;
  }

  school(dto: StudentSchoolDTO | null): Student['school'] {
    return dto
      ? {
          id: dto.id,
          displayName: getLocalizedName(dto),
        }
      : null;
  }

  level(dto: StudentLevelDTO | null): Student['level'] {
    return dto
      ? {
          id: dto.id,
          displayName: getLocalizedName(dto),
        }
      : null;
  }

  class(dto: StudentClassDTO | null): Student['class'] {
    return dto
      ? {
          id: dto.id,
          displayName: getLocalizedName(dto),
        }
      : null;
  }

  academicYear(dto: AcademicYearDTO): Student['academicYear'] {
    return dto
      ? {
          id: dto.id,
          displayName: dto.name,
        }
      : null;
  }

  guardian(dto: StudentGuardianDTO): StudentGuardian {
    return {
      id: dto.id,
      displayName: getLocalizedFullName(dto),
      displayPhoneNumber: `${dto.countryCode} ${dto.phoneNumber}`,
      nationalId: dto.nationalId,
      guardianRelationship: dto.guardianRelationship,
      profileColor: dto.profileColor,
      imageUrl: dto.imageUrl,
    };
  }

  guardians(dto: StudentGuardianDTO[] | null): StudentGuardian[] {
    return ensureArray(dto).map((guardian) => this.guardian(guardian));
  }
})();

/**
 * Resolves the school structure for a student based on the schoolLevelId.
 * This is useful when school structure data is not directly available in the student DTO,
 * and the student is associated with a school level.
 *
 * @param student - The student object containing school structure details.
 * @returns An object containing the resolved school, level, campus, and company information.
 */
export function resolveSchoolStructure(
  student: StudentDTO,
): ResolvedSchoolStructure | null {
  const { schoolLevelId, schoolLevels, schools, levels, campuses, companies } =
    student;

  if (!schoolLevelId) {
    return null; // Return null if no schoolLevelId is present.
  }

  const schoolLevel = schoolLevels?.find((level) => level.id === schoolLevelId);
  if (!schoolLevel) return null; // Return early if schoolLevel is not found.

  const school = schools.find((s) => s.id === schoolLevel.schoolId) ?? null;
  const level = levels.find((l) => l.id === schoolLevel.levelId) ?? null;
  const campus = campuses.find((c) => c.id === school?.campusId) ?? null;
  const company = companies.find((co) => co.id === campus?.companyId) ?? null;

  return {
    school: STUDENT_MAP_FROM_DTO.school(school),
    level: STUDENT_MAP_FROM_DTO.level(level),
    campus: STUDENT_MAP_FROM_DTO.campus(campus),
    company: STUDENT_MAP_FROM_DTO.company(company),
  };
}

interface ResolvedSchoolStructure {
  school: Student['school'] | null;
  level: Student['level'] | null;
  campus: Student['campus'] | null;
  company: Student['company'] | null;
}
