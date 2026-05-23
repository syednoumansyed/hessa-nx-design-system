// ═══════════════════════════════════════════════════════════════════════════
// LEVELS & SUBJECTS - Domain Models (after DTO transformation)
// ═══════════════════════════════════════════════════════════════════════════

export interface LearningOutcomeLevel {
  id: number;
  displayName: string;
}

export interface LearningOutcomeSubject {
  id: number;
  displayName: string;
  iconUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNITS - Domain Models
// ═══════════════════════════════════════════════════════════════════════════

export interface UnitsWithSummary {
  summary: UnitsSummary;
  units: LearningOutcomeUnit[];
}

export interface UnitsSummary {
  unitCount: number;
  lessonCount: number;
  learningOutcomeCount: number;
}

export interface LearningOutcomeUnit {
  id: number;
  displayName: string;
  enName: string;
  arName: string;
  subjectId: number;
  levelId: number;
  lessonCount: number;
  lessons: LearningOutcomeLesson[];
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSONS - Domain Models
// ═══════════════════════════════════════════════════════════════════════════

export interface LearningOutcomeLesson {
  id: number;
  displayName: string;
  enName: string;
  arName: string;
  outcomesCount: number;
}

export interface LessonDetail {
  id: number;
  displayName: string;
  unitId: number;
  unitName: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEARNING OUTCOMES - Domain Models
// ═══════════════════════════════════════════════════════════════════════════

export interface OutcomesWithSummary {
  summary: OutcomesSummary;
  outcomes: LearningOutcome[];
}

export interface OutcomesSummary {
  learningOutcomeCount: number;
  domainCount: number;
  lessonCount: number;
}

export interface LearningOutcome {
  id: number;
  displayStatement: string;
  educationalPaths: string[];
  domains: OutcomeDomain[];
}

export interface LearningOutcomeDetail {
  id: number;
  enStatement: string;
  arStatement: string;
  educationalPaths: string[];
  domains: OutcomeDomain[];
  lessonIds: number[];
}

export interface OutcomeDomain {
  id: number;
  displayName: string;
  color: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY - Domain Models
// ═══════════════════════════════════════════════════════════════════════════

export interface LearningOutcomeSubjectSummary {
  subjectId: number;
  subjectName: string;
  levelId: number;
  levelName: string;
  totalUnits: number;
  totalLessons: number;
  totalOutcomes: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM PAYLOADS - For add/update operations
// ═══════════════════════════════════════════════════════════════════════════

export interface AddUnitPayload {
  enName: string;
  arName: string;
  subjectId: number;
  levelId: number;
}

export interface AddLessonPayload {
  enName: string;
  arName: string;
  unitId: number;
}

export interface AddOutcomePayload {
  enStatement?: string;
  arStatement?: string;
  educationalPaths: string[];
  domainIds: number[];
  lessonIds: number[];
}

// ═══════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export interface LessonSelectionItem {
  id: number;
  displayName: string;
  isSelected: boolean;
}
