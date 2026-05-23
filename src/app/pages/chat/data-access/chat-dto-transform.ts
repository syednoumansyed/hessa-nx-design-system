import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import { UserProfileColors } from '@shared/enums';
import {
  ChatPersonnelDTO,
  ChatGroupMetadataDTO,
  ChatUserMetadataDTO,
  ChatStudentDTO,
  ChatGroupDTO,
} from './chat.dto';
import {
  ChatPersonnel,
  ChatGroupMetadata,
  ChatUserMetadata,
  ChatStudent,
  ChatGroup,
} from './chat.interface';

export const CHAT_MAP_FROM_DTO = new (class {
  teacher(dto: ChatPersonnelDTO): ChatPersonnel {
    return {
      id: dto.id,
      userId: dto.userId,
      displayName: getLocalizedFullName(dto),
      profileColor: dto.profileColor,
      chatId: dto.chatId,
      students: dto.students
        ? dto.students.map((student) => ({
            id: student.id,
            displayName: getLocalizedFullName(student),
          }))
        : [],
      subjects: dto.subjects
        ? dto.subjects.map((subject) => ({
            id: subject.id,
            displayName: getLocalizedName(subject),
          }))
        : [],
      roles: dto.roles.map((role) => ({
        id: role.id,
        displayName: getLocalizedName(role),
      })),
    };
  }

  student(dto: ChatStudentDTO): ChatStudent {
    return {
      id: dto.id,
      userId: dto.userId,
      chatId: dto.chatId,
      displayName: getLocalizedFullName(dto),
      imageUrl: dto.imageUrl,
      guardians: dto.guardians.map((guardian) => ({
        id: guardian.id,
        userId: guardian.userId,
        chatId: guardian.chatId,
        displayName: getLocalizedFullName(guardian),
        profileColor: guardian.profileColor,
        studentRelationship: guardian.studentRelationship,
        guardianRelationship: guardian.guardianRelationship,
      })),
    };
  }

  group(dto: ChatGroupDTO): ChatGroup {
    return {
      id: dto.id,
      displayName: `${getLocalizedName(dto)} - ${getLocalizedName(dto.levels[0])}`,
      level: {
        id: dto.levels[0].id,
        displayName: getLocalizedName(dto.levels[0]),
      },
      academicYearId: dto.academicYearId,
      chatId: dto.chatId,
    };
  }

  metadata(
    dto: ChatGroupMetadataDTO | ChatUserMetadataDTO,
  ): ChatGroupMetadata | ChatUserMetadata {
    if (this.isGroupMetadata(dto)) {
      return this.groupMetadata(dto);
    } else {
      return this.userMetadata(dto);
    }
  }

  private isGroupMetadata(
    dto: ChatGroupMetadataDTO | ChatUserMetadataDTO,
  ): dto is ChatGroupMetadataDTO {
    return 'extracted' in dto && 'target' in dto.extracted;
  }

  private groupMetadata(dto: ChatGroupMetadataDTO): ChatGroupMetadata {
    return {
      id: dto.id.toString(),
      type: dto.type,
      academicYearId: dto.extracted.academicYearId,
      displayName: `${getLocalizedName(dto.metadata)} - ${getLocalizedName(dto.metadata.level)}`,
      level: {
        id: dto.metadata.level.id,
        displayName: getLocalizedName(dto.metadata.level),
      },
      students:
        dto.metadata.students?.map((student) => ({
          id: student.id,
          displayName: getLocalizedFullName(student),
        })) ?? [],
    };
  }

  private userMetadata(dto: ChatUserMetadataDTO): ChatUserMetadata {
    const metadata = dto?.metadata;
    const extracted = dto?.extracted;

    return {
      id: dto?.id?.toString() ?? '',
      type: dto?.type ?? '',
      role: extracted?.role ?? '',
      userId: extracted?.userId ?? 0,
      userTypeId: metadata?.userTypeId ?? 0,
      displayName: metadata ? getLocalizedFullName(metadata) : 'Unknown User',
      profileColor:
        (metadata?.profileColor as UserProfileColors) ??
        UserProfileColors.NEUTRAL,
      imageUrl: metadata?.imageUrl,
      isAvatar: metadata?.isAvatar,
      snoozeStartTime: metadata?.snoozeStartTime ?? null,
      snoozeEndTime: metadata?.snoozeEndTime ?? null,
      students:
        metadata?.students?.map((student) => ({
          id: student.id,
          displayName: getLocalizedFullName(student),
        })) ?? [],
      classes:
        metadata?.classes?.map((classItem) => ({
          id: classItem.id,
          displayName: getLocalizedName(classItem),
        })) ?? [],
      subjects:
        metadata?.subjects?.map((subject) => ({
          id: subject.id,
          displayName: getLocalizedName(subject),
        })) ?? [],
      roles:
        metadata?.roles?.map((role) => ({
          id: role.id,
          displayName: getLocalizedName(role),
        })) ?? [],
    };
  }
})();
