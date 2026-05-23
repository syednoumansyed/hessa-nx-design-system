import { UserProfileColors } from '@shared/enums';

export interface ChatPersonnelDTO {
  id: number;
  userId: number;
  arFullName: string | null;
  enFullName: string | null;
  profileColor: UserProfileColors;
  gender: string;
  tenantId: number;
  chatId: string;
  students:
    | {
        id: number;
        arFullName: string | null;
        enFullName: string | null;
      }[]
    | null;
  subjects:
    | {
        id: number;
        arName: string | null;
        enName: string | null;
      }[]
    | null;
  roles: {
    id: number;
    arName: string | null;
    enName: string | null;
  }[];
}

export interface ChatGroupMetadataDTO {
  id: string;
  type: string;
  extracted: {
    target: string;
    targetId: number;
    academicYearId: number;
    tenantId: number;
  };
  metadata: {
    id: number;
    arName: string | null;
    enName: string | null;
    level: {
      id: number;
      arName: string | null;
      enName: string | null;
    };
    students?: {
      id: number;
      arFullName: string | null;
      enFullName: string | null;
    }[];
  };
}

export interface ChatUserMetadataDTO {
  id: string;
  type: string;
  extracted: {
    role: string;
    tenantId: number;
    userId: number;
  };
  metadata: {
    id: number;
    userTypeId: number;
    arFullName: string | null;
    enFullName: string | null;
    profileColor: UserProfileColors;
    gender: string;
    imageUrl?: string;
    isAvatar?: boolean;
    snoozeStartTime?: string | null;
    snoozeEndTime?: string | null;
    students?: {
      id: number;
      arFullName: string | null;
      enFullName: string | null;
    }[];
    classes?: {
      id: number;
      arName: string | null;
      enName: string | null;
      levels: {
        id: number;
        arName: string | null;
        enName: string | null;
      }[];
    }[];
    subjects?: {
      id: number;
      arName: string | null;
      enName: string | null;
    }[];
    roles: {
      id: number;
      arName: string | null;
      enName: string | null;
    }[];
  };
}

export interface ChatGuardianDTO {
  id: number;
  userId: number;
  chatId: string;
  arFullName: string | null;
  enFullName: string | null;
  profileColor: UserProfileColors;
  studentRelationship: string;
  guardianRelationship: string;
}

export interface ChatStudentDTO {
  id: number;
  userId: number;
  chatId: string;
  arFullName: string | null;
  enFullName: string | null;
  imageUrl: string;
  isAvatar: boolean;
  schoolStructure: {
    class: {
      id: number;
      arName: string | null;
      enName: string | null;
      schoolLevelId: number;
    };
    level: {
      id: number;
      arName: string | null;
      enName: string | null;
    };
    campus: {
      id: number;
      arName: string | null;
      enName: string | null;
      companyId: number;
    };
    school: {
      id: number;
      arName: string | null;
      enName: string | null;
      campusId: number;
    };
    company: {
      id: number;
      arName: string | null;
      enName: string | null;
      parentId: number | null;
    };
    schoolLevel: {
      id: number;
      levelId: number;
      schoolId: number;
    };
    academicYear: {
      id: number;
      name: string;
    };
  }[];
  guardians: ChatGuardianDTO[];
}

export interface ChatGroupDTO {
  id: number;
  arName: string | null;
  enName: string | null;
  levels: {
    id: number;
    arName: string | null;
    enName: string | null;
  }[];
  academicYearId: number;
  chatId: string;
}
