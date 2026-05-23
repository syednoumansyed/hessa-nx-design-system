import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import {
  ConnectedProfileDTO,
  CreatedByDTO,
  FullNameLocalizedIdentifiableDTO,
  GlobalClassDTO,
  NameLocalizedIdentifiableDTO,
  NationalityDTO,
  UpdatedByDTO,
  UserEventDTO,
} from './common.dto';
import {
  ConnectedProfile,
  CreatedBy,
  FullNameLocalizedIdentifiable,
  GlobalClass,
  NameLocalizedIdentifiable,
  Nationality,
  UpdatedBy,
  UserEvent,
} from './common.interface';
import { isNonEmptyObject } from '@shared/utils/is-non-empty-object.util';
import { ensureArray } from '@shared/utils/array.util';
import { Idropdown } from '@shared/interfaces';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';

export const COMMON_MAP_FROM_DTO = new (class {
  createdBy(dto: CreatedByDTO): CreatedBy {
    return {
      id: dto.id,
      displayName: getLocalizedFullName(dto),
    };
  }

  updatedBy(dto: UpdatedByDTO): UpdatedBy {
    return {
      id: dto.id,
      displayName: getLocalizedFullName(dto),
    };
  }

  userEvent(dto: UserEventDTO): UserEvent {
    return {
      id: dto.id,
      userId: dto.userId,
      eventType: dto.eventType,
      createdAt: dto.createdAt,
      tenantId: dto.tenantId,
    };
  }

  nationalities(dtos: NationalityDTO[] | null): Nationality[] {
    return ensureArray(dtos).map((dto) => ({
      id: dto.id,
      arName: dto.arName,
      enName: dto.enName,
      displayName: getLocalizedName(dto),
    }));
  }

  userEvents(dtos: UserEventDTO[] | null): UserEvent[] {
    return (dtos || []).map((dto) => this.userEvent(dto));
  }

  displayNameIdentifiable(
    dto: NameLocalizedIdentifiableDTO | FullNameLocalizedIdentifiableDTO,
  ): { id: number; displayName: string } {
    return {
      id: dto.id,
      displayName:
        'enName' in dto && 'arName' in dto
          ? getLocalizedName(dto)
          : getLocalizedFullName(dto),
    };
  }

  displayNameIdentifiables(
    dtos: Array<
      NameLocalizedIdentifiableDTO | FullNameLocalizedIdentifiableDTO
    > | null,
  ): Array<{ id: number; displayName: string }> {
    return ensureArray(dtos).map((dto) => this.displayNameIdentifiable(dto));
  }
  nameIdentifiable(
    dto: NameLocalizedIdentifiableDTO,
  ): NameLocalizedIdentifiable {
    return {
      id: dto.id,
      arName: dto.arName,
      enName: dto.enName,
      displayName: getLocalizedName(dto),
    };
  }

  namesIdentifiable(
    dtos: NameLocalizedIdentifiableDTO[] | null,
  ): NameLocalizedIdentifiable[] {
    return ensureArray(dtos).map((dto) => this.nameIdentifiable(dto));
  }

  fullNameIdentifiable(
    dto: FullNameLocalizedIdentifiableDTO,
  ): FullNameLocalizedIdentifiable {
    return {
      id: dto.id,
      arFullName: dto.arFullName,
      enFullName: dto.enFullName,
      displayName: getLocalizedFullName(dto),
    };
  }

  connectedProfile(dto: ConnectedProfileDTO): ConnectedProfile | null {
    if (!isNonEmptyObject(dto)) return null;
    return {
      id: dto.id,
      displayName: getLocalizedFullName(dto),
      countryCode: dto.countryCode,
      phoneNumber: dto.phoneNumber,
      nationalId: dto.nationalId,
      type: dto.type,
      profileColor: dto.profileColor,
    };
  }

  globalClass(dto: GlobalClassDTO[]): Array<GlobalClass> {
    return ensureArray(dto).map((item) => ({
      id: item.id,
      arName: item.arName,
      enName: item.enName,
      displayedValue: getLocalizedName(item),
      // For comparison and dropdowns, use enName as value. Both arName and enName are stored for multilingual support.
      value: item.enName ?? item.arName,
    }));
  }
})();
