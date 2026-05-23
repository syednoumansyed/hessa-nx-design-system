import { getLocalizedName } from '@shared/utils/localization.util';
import {
  CampusDTO,
  ClassDTO,
  CompanyDTO,
  LevelDTO,
  SchoolDTO,
  SchoolLevelDTO,
  StageDTO,
} from './organization.dto';
import {
  Campus,
  Class,
  Company,
  Level,
  School,
  Stage,
} from './organization.interface';
import { COMMON_MAP_FROM_DTO } from '../common/common-dto-transform';
import { ensureArray } from '@shared/utils/array.util';
import { isObject } from '@shared/utils/object.util';
import { IAttachment } from '@shared/interfaces/attachment';

export const ORGANIZATION_MAP_FORM_DTO = new (class {
  company(dto: CompanyDTO): Company {
    const { subCompanies, campuses, hasAccess } = dto;
    return {
      id: dto.id,
      displayName: getLocalizedName(dto),
      arName: dto.arName,
      enName: dto.enName,
      hasAccess: hasAccess,
      campuses: ensureArray(campuses).map((campus) => this.campus(campus)),
      parentId: dto.parentId,
      createdBy: COMMON_MAP_FROM_DTO.createdBy(dto.createdBy),
      createdAt: dto.createdAt,
      attachments: this.companyAttachments(dto),
      displayLogo: dto.url ?? null,
      subCompanies: ensureArray(subCompanies).map((subCompany) =>
        this.company(subCompany),
      ),
    };
  }

  companies(dtos: CompanyDTO[]): Company[] {
    return Array.isArray(dtos) ? dtos.map((dto) => this.company(dto)) : [];
  }

  campus(dto: CampusDTO): Campus {
    return {
      id: dto.id,
      displayName: getLocalizedName(dto),
      arName: dto.arName,
      enName: dto.enName,
      companyId: dto.companyId,
      company: dto.company ? this.company(dto.company) : null,
      schools: ensureArray(dto.schools).map((school) => this.school(school)),
      hasAccess: dto.hasAccess,
      district: dto.district,
      city: dto.city,
      phoneNumber: dto.phoneNumber,
      countryCode: dto.countryCode,
      country: dto.country,
      website: dto.website,
      description: dto.description ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      createdAt: dto.createdAt,
      createdBy: COMMON_MAP_FROM_DTO.createdBy(dto.createdBy),
    };
  }

  school(dto: SchoolDTO): School {
    return {
      id: dto.id,
      displayName: getLocalizedName(dto),
      arName: dto.arName,
      enName: dto.enName,
      campusId: dto.campusId,
      hasAccess: dto.hasAccess,
      campus: dto.campus ? this.campus(dto.campus) : null,
      gender: dto.gender,
      createdAt: dto.createdAt,
      educationalPath: dto.educationalPath,
      stage: dto.stage ? this.stage(dto.stage) : null,
      createdBy: COMMON_MAP_FROM_DTO.createdBy(dto.createdBy),
      attachments: this.schoolAttachments(dto),
      displayLogo: dto.url ?? null,
      examController: dto.examController ?? null,
      principal: dto.principal ?? null,
      schoolLevels: Array.isArray(dto.schoolLevels)
        ? dto.schoolLevels.map((level) => this.schoolLevel(level))
        : Array.isArray(dto.levels)
          ? dto.levels.map((level) => this.level(level))
          : [],
    };
  }

  companyAttachments(dto: CompanyDTO): IAttachment[] {
    const { key, url, extension } = dto;
    if (!key || !url) {
      return [];
    }
    const attachment: IAttachment = {
      key: key,
      url: url,
      extension: extension,
    };
    return [attachment];
  }

  schoolAttachments(dto: SchoolDTO): IAttachment[] {
    const { key, url, extension } = dto;
    if (!key || !url) {
      return [];
    }
    const attachment: IAttachment = {
      key: key,
      url: url,
      extension: extension,
    };
    return [attachment];
  }

  schoolLevel(dto: SchoolLevelDTO): Level {
    const { level } = dto;
    return {
      id: dto.levelId || dto.id,
      displayName: level
        ? getLocalizedName(level)
        : getLocalizedName({
            enName: dto.enName ?? null,
            arName: dto.arName ?? null,
          }),
      arName: level ? level.arName : '',
      enName: level ? level.enName : '',
      hasAccess: dto.hasAccess,
      schoolId: dto.schoolId ?? null,
      classes: ensureArray(dto.classes).map((cls) => this.class(cls)),
      schoolLevelId: dto.id ?? null,
      createdBy: isObject(dto.createdBy)
        ? COMMON_MAP_FROM_DTO.createdBy(dto.createdBy)
        : null,
      createdAt: dto.createdAt,
    };
  }

  level(dto: LevelDTO): Level {
    return {
      id: dto.id,
      displayName: getLocalizedName(dto),
      arName: dto.arName,
      enName: dto.enName,
      hasAccess: null,
      schoolId: null,
      classes: [],
      schoolLevelId: null,
      createdAt: dto.createdAt,
      createdBy: isObject(dto.createdBy)
        ? COMMON_MAP_FROM_DTO.createdBy(dto.createdBy)
        : null,
    };
  }

  class(dto: ClassDTO): Class {
    return {
      id: dto.id,
      arName: dto.arName,
      enName: dto.enName,
      displayName: getLocalizedName(dto),
      hasAccess: dto.hasAccess,
      schoolLevelId: dto.schoolLevelId,
      roomNumber: dto.roomNumber,
      createdAt: dto.createdAt,
      value: dto.enName ?? dto.arName, // using enName for value where we need to select in dropdown
      createdBy: isObject(dto.createdBy)
        ? COMMON_MAP_FROM_DTO.createdBy(dto.createdBy)
        : null,
    };
  }

  stage(dto: StageDTO): Stage {
    return {
      id: dto.id,
      displayName: getLocalizedName(dto),
      arName: dto.arName,
      enName: dto.enName,
    };
  }

  stages(dtos: StageDTO[]): Stage[] {
    return ensureArray(dtos).map((dto) => this.stage(dto));
  }
})();
