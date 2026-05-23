import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import { DenialReasonDTO, PickupResponseDTO, TimelineDTO } from './pickup.dto';
import { DenialReason, PickupResponse, Timeline } from './pickup.interface';
import { COMMON_MAP_FROM_DTO } from '../common';
import { ensureArray } from '@shared/utils/array.util';
import { PickupRequestBy } from '@shared/enums';

export const PICK_UP_MAP_FROM_DTO = new (class {
  pickup(dto: PickupResponseDTO): PickupResponse {
    const { schoolStructure, guardian, pickupRequest, pickupDelegator } = dto;
    return {
      id: dto.id,
      displayName: getLocalizedFullName(dto),
      gender: dto.gender,
      imageUrl: dto.imageUrl,
      nationalId: dto.nationalId ?? '',
      pickupDelegator: pickupDelegator
        ? {
            id: pickupDelegator.id,
            displayName: getLocalizedFullName(pickupDelegator),
            nationalId: pickupDelegator.nationalId,
          }
        : null,
      pickedByName: pickupDelegator
        ? getLocalizedFullName(pickupDelegator)
        : getLocalizedFullName(guardian),
      pickedByType: pickupDelegator
        ? PickupRequestBy.DELEGATE
        : PickupRequestBy.GUARDIAN,
      schoolStructure: {
        class: COMMON_MAP_FROM_DTO.displayNameIdentifiable(
          schoolStructure.class,
        ),
        level: COMMON_MAP_FROM_DTO.displayNameIdentifiable(
          schoolStructure.level,
        ),
        school: COMMON_MAP_FROM_DTO.displayNameIdentifiable(
          schoolStructure.school,
        ),
        campus: {
          id: schoolStructure.campus.id,
          displayName: getLocalizedName(schoolStructure.campus),
          latitude: parseFloat(schoolStructure.campus.latitude) || 0,
          longitude: parseFloat(schoolStructure.campus.longitude) || 0,
        },
      },
      guardian: {
        id: guardian.id,
        userId: guardian.userId,
        displayName: getLocalizedFullName(guardian),
        gender: guardian.gender,
        displayPhoneNumber: `${guardian.countryCode}${guardian.phoneNumber}`,
      },
      endTime: dto.endTime,
      pickupRequest: pickupRequest
        ? {
            id: pickupRequest.id,
            status: pickupRequest.status,
            createdAt: pickupRequest.createdAt,
            deniedOptionId: pickupRequest.deniedOptionId ?? null,
          }
        : null,
      insidePickupRadius: dto.insidePickupRadius ?? false,
      isAvatar: dto.isAvatar,
      attendanceStatus: dto.attendanceStatus,
    };
  }

  pickups(dtos: PickupResponseDTO[]): PickupResponse[] {
    return Array.isArray(dtos) ? dtos.map((dto) => this.pickup(dto)) : [];
  }

  timeLine(dto: TimelineDTO): Timeline {
    return {
      id: dto.id,
      status: dto.status,
      reason: dto.reason,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deniedOption: dto.deniedOption,
    };
  }

  timelines(dtos: TimelineDTO[]): Timeline[] {
    return ensureArray(dtos).map((dto) => this.timeLine(dto));
  }

  denialReason(dto: DenialReasonDTO): DenialReason {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      url: dto.url,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt ?? null,
    };
  }

  denialReasons(dtos: DenialReasonDTO[]): DenialReason[] {
    return ensureArray(dtos).map((dto) => this.denialReason(dto));
  }
})();
