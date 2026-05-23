// ═══════════════════════════════════════════════════════════════════════════
// LEVELS & SUBJECTS DTOs
// ═══════════════════════════════════════════════════════════════════════════

export interface LearningOutcomeLevelDTO {
  id: number;
  arName: string;
  enName: string;
  tenantId: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
    arFullName: string;
    enFullName: string;
  };
  updatedBy: {
    id: number;
    arFullName: string;
    enFullName: string;
  } | null;
}

export interface LearningOutcomeSubjectDTO {
  id: number;
  arName: string;
  enName: string;
  url?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNITS DTOs
// ═══════════════════════════════════════════════════════════════════════════

export interface FetchUnitsResponseDTO {
  summary: {
    unitCount: number;
    lessonCount: number;
    learningOutcomeCount: number;
  };
  units: LearningOutcomeUnitDTO[];
}

export interface LearningOutcomeUnitDTO {
  id: number;
  arName: string;
  enName: string;
  subjectId: number;
  levelId: number;
  tenantId: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number | null;
  subject: {
    id: number;
    arName: string;
    enName: string;
  };
  level: {
    id: number;
    arName: string;
    enName: string;
  };
  lessonCount: number;
  lessons: LearningOutcomeLessonDTO[];
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSONS DTOs
// ═══════════════════════════════════════════════════════════════════════════

export interface LearningOutcomeLessonDTO {
  id: number;
  arName: string;
  enName: string;
  learningOutcomeCount: number;
}

export interface FetchLessonsResponseDTO {
  lessons: LearningOutcomeLessonDTO[];
}

export interface LessonDetailDTO {
  id: number;
  enName: string;
  arName: string;
  unitId: number;
  unit: {
    id: number;
    arName: string;
    enName: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LEARNING OUTCOMES DTOs
// ═══════════════════════════════════════════════════════════════════════════

export interface FetchOutcomesResponseDTO {
  summary: {
    learningOutcomeCount: number;
    domainCount: number;
    lessonCount: number;
  };
  learningOutcomes: LearningOutcomeDTO[];
}

export interface LearningOutcomeDTO {
  id: number;
  enStatement: string;
  arStatement: string;
  educationalPaths: string[];
  domains: LearningOutcomeDomainDTO[];
}

export interface LearningOutcomeDetailDTO {
  id: number;
  enStatement: string;
  arStatement: string;
  educationalPaths: string[];
  domains: LearningOutcomeDomainDTO[];
  lessons: {
    id: number;
    arName: string;
    enName: string;
  }[];
}

export interface LearningOutcomeDomainDTO {
  id: number;
  color: string;
  arName: string;
  enName: string;
}
