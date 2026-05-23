import { getLocalizedName } from '@shared/utils/localization.util';
import { ensureArray } from '@shared/utils/array.util';
import {
  LearningOutcomeLevelDTO,
  LearningOutcomeSubjectDTO,
  LearningOutcomeUnitDTO,
  LearningOutcomeLessonDTO,
  LearningOutcomeDTO,
  LearningOutcomeDomainDTO,
  LearningOutcomeDetailDTO,
  FetchUnitsResponseDTO,
  FetchOutcomesResponseDTO,
  LessonDetailDTO,
} from './learning-outcomes.dto';
import {
  LearningOutcomeLevel,
  LearningOutcomeSubject,
  LearningOutcomeUnit,
  LearningOutcomeLesson,
  LearningOutcome,
  LearningOutcomeDetail,
  OutcomeDomain,
  UnitsWithSummary,
  OutcomesWithSummary,
  LessonDetail,
} from './learning-outcomes.interface';

export const LEARNING_OUTCOMES_MAP_FROM_DTO = new (class {
  // ═══════════════════════════════════════════════════════════════════════════
  // LEVELS
  // ═══════════════════════════════════════════════════════════════════════════

  levels(dto: LearningOutcomeLevelDTO[]): LearningOutcomeLevel[] {
    return ensureArray(dto).map((item) => this.level(item));
  }

  level(dto: LearningOutcomeLevelDTO): LearningOutcomeLevel {
    return {
      id: dto.id,
      displayName: getLocalizedName({
        arName: dto.arName,
        enName: dto.enName,
      }),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBJECTS
  // ═══════════════════════════════════════════════════════════════════════════

  subjects(dto: LearningOutcomeSubjectDTO[]): LearningOutcomeSubject[] {
    return ensureArray(dto).map((item) => this.subject(item));
  }

  subject(dto: LearningOutcomeSubjectDTO): LearningOutcomeSubject {
    return {
      id: dto.id,
      displayName: getLocalizedName({
        arName: dto.arName,
        enName: dto.enName,
      }),
      iconUrl: dto.url,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UNITS
  // ═══════════════════════════════════════════════════════════════════════════

  unitsWithSummary(dto: FetchUnitsResponseDTO): UnitsWithSummary {
    return {
      summary: {
        unitCount: dto.summary.unitCount,
        lessonCount: dto.summary.lessonCount,
        learningOutcomeCount: dto.summary.learningOutcomeCount,
      },
      units: this.units(dto.units),
    };
  }

  units(dto: LearningOutcomeUnitDTO[]): LearningOutcomeUnit[] {
    return ensureArray(dto).map((item) => this.unit(item));
  }

  unit(dto: LearningOutcomeUnitDTO): LearningOutcomeUnit {
    return {
      id: dto.id,
      displayName: getLocalizedName({
        arName: dto.arName,
        enName: dto.enName,
      }),
      enName: dto.enName,
      arName: dto.arName,
      subjectId: dto.subjectId,
      levelId: dto.levelId,
      lessonCount: dto.lessonCount ?? 0,
      lessons: this.lessons(dto.lessons ?? []),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSONS
  // ═══════════════════════════════════════════════════════════════════════════

  lessons(dto: LearningOutcomeLessonDTO[]): LearningOutcomeLesson[] {
    return ensureArray(dto).map((item) => this.lesson(item));
  }

  lesson(dto: LearningOutcomeLessonDTO): LearningOutcomeLesson {
    return {
      id: dto.id,
      displayName: getLocalizedName({
        arName: dto.arName,
        enName: dto.enName,
      }),
      enName: dto.enName,
      arName: dto.arName,
      outcomesCount: dto.learningOutcomeCount ?? 0,
    };
  }

  lessonDetail(dto: LessonDetailDTO): LessonDetail {
    return {
      id: dto.id,
      displayName: getLocalizedName({
        arName: dto.arName,
        enName: dto.enName,
      }),
      unitId: dto.unitId,
      unitName: getLocalizedName({
        arName: dto.unit.arName,
        enName: dto.unit.enName,
      }),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEARNING OUTCOMES
  // ═══════════════════════════════════════════════════════════════════════════

  outcomesWithSummary(dto: FetchOutcomesResponseDTO): OutcomesWithSummary {
    return {
      summary: {
        learningOutcomeCount: dto.summary.learningOutcomeCount,
        domainCount: dto.summary.domainCount,
        lessonCount: dto.summary.lessonCount,
      },
      outcomes: this.outcomes(dto.learningOutcomes),
    };
  }

  outcomes(dto: LearningOutcomeDTO[]): LearningOutcome[] {
    return ensureArray(dto).map((item) => this.outcome(item));
  }

  outcome(dto: LearningOutcomeDTO): LearningOutcome {
    return {
      id: dto.id,
      displayStatement: getLocalizedName({
        arName: dto.arStatement,
        enName: dto.enStatement,
      }),
      educationalPaths: dto.educationalPaths ?? [],
      domains: this.domains(dto.domains ?? []),
    };
  }

  outcomeDetail(dto: LearningOutcomeDetailDTO): LearningOutcomeDetail {
    return {
      id: dto.id,
      enStatement: dto.enStatement,
      arStatement: dto.arStatement,
      educationalPaths: dto.educationalPaths ?? [],
      domains: this.domains(dto.domains ?? []),
      lessonIds: (dto.lessons ?? []).map((l) => l.id),
    };
  }

  domains(dto: LearningOutcomeDomainDTO[]): OutcomeDomain[] {
    return ensureArray(dto).map((item) => this.domain(item));
  }

  domain(dto: LearningOutcomeDomainDTO): OutcomeDomain {
    return {
      id: dto.id,
      displayName: getLocalizedName({
        arName: dto.arName,
        enName: dto.enName,
      }),
      color: dto.color,
    };
  }
})();
