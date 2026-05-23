import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import { ensureArray } from '@shared/utils/array.util';
import { DelegateDTO, DelegateStudentDTO } from './delegate-dto';
import {
  Delegate,
  DelegateStudent,
  DelegateStatus,
} from './delegate.interface';

export const DELEGATE_MAP_FROM_DTO = new (class {
  delegate(dto: DelegateDTO): Delegate {
    return {
      id: dto.id,
      arFullName: dto.arFullName,
      enFullName: dto.enFullName,
      displayName: getLocalizedFullName(dto),
      nationalId: dto.nationalId,
      key: dto.key,
      url: dto.url,
      expiryDate: dto.expiryDate,
      status: dto.status as DelegateStatus,
      students: this.delegateStudents(dto.students),
      qrCode: dto.qrCode ?? null,
      guardianId: dto.guardianId,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  delegateStudent(dto: DelegateStudentDTO): DelegateStudent {
    return {
      id: dto.id,
      studentId: dto.studentId,
      arFullName: dto.arFullName,
      enFullName: dto.enFullName,
      displayName: getLocalizedFullName(dto),
      levelId: dto.levelId,
      arLevelName: dto.arLevelName,
      enLevelName: dto.enLevelName,
      levelName: getLocalizedName({
        arName: dto.arLevelName,
        enName: dto.enLevelName,
      }),
      classId: dto.classId,
      arClassName: dto.arClassName,
      enClassName: dto.enClassName,
      className: getLocalizedName({
        arName: dto.arClassName,
        enName: dto.enClassName,
      }),
    };
  }

  delegateStudents(dtos: DelegateStudentDTO[]): DelegateStudent[] {
    return ensureArray(dtos).map((dto) => this.delegateStudent(dto));
  }

  delegates(dtos: DelegateDTO[]): Delegate[] {
    return ensureArray(dtos).map((dto) => this.delegate(dto));
  }
})();
