import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, finalize } from 'rxjs';
import { IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import {
  LearningOutcomeLevel,
  LearningOutcomeSubject,
  LearningOutcomeUnit,
  LearningOutcomeLesson,
  LearningOutcome,
  LearningOutcomeDetail,
  LearningOutcomeSubjectSummary,
  AddUnitPayload,
  AddLessonPayload,
  AddOutcomePayload,
  UnitsWithSummary,
  UnitsSummary,
  OutcomesWithSummary,
  OutcomesSummary,
  LessonDetail,
  OutcomeDomain,
} from './learning-outcomes.interface';
import {
  LearningOutcomeLevelDTO,
  LearningOutcomeSubjectDTO,
  LearningOutcomeUnitDTO,
  LearningOutcomeLessonDTO,
  LearningOutcomeDTO,
  LearningOutcomeDetailDTO,
  FetchUnitsResponseDTO,
  FetchOutcomesResponseDTO,
  FetchLessonsResponseDTO,
  LessonDetailDTO,
  LearningOutcomeDomainDTO,
} from './learning-outcomes.dto';
import { LEARNING_OUTCOMES_MAP_FROM_DTO } from './learning-outcomes-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class LearningOutcomesService {
  private readonly http = inject(HttpClient);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE - Signals
  // ═══════════════════════════════════════════════════════════════════════════

  // Selected level and subject state
  private readonly _selectedLevel = signal<LearningOutcomeLevel | null>(null);
  readonly selectedLevel = this._selectedLevel.asReadonly();

  private readonly _selectedSubject = signal<LearningOutcomeSubject | null>(
    null,
  );
  readonly selectedSubject = this._selectedSubject.asReadonly();

  // Levels and subjects lists
  private readonly _levels = signal<LearningOutcomeLevel[]>([]);
  readonly levels = this._levels.asReadonly();

  private readonly _subjects = signal<LearningOutcomeSubject[]>([]);
  readonly subjects = this._subjects.asReadonly();

  // Subject outcomes data (units, lessons, outcomes)
  private readonly _subjectOutcomesSummary =
    signal<LearningOutcomeSubjectSummary | null>(null);
  readonly subjectOutcomesSummary = this._subjectOutcomesSummary.asReadonly();

  private readonly _units = signal<LearningOutcomeUnit[]>([]);
  readonly units = this._units.asReadonly();

  private readonly _lessons = signal<LearningOutcomeLesson[]>([]);
  readonly lessons = this._lessons.asReadonly();

  private readonly _outcomes = signal<LearningOutcome[]>([]);
  readonly outcomes = this._outcomes.asReadonly();

  private readonly _selectedLesson = signal<LessonDetail | null>(null);
  readonly selectedLesson = this._selectedLesson.asReadonly();

  private readonly _domains = signal<OutcomeDomain[]>([]);
  readonly domains = this._domains.asReadonly();

  // Loading states
  private readonly _isLoadingLevels = signal<boolean>(false);
  readonly isLoadingLevels = this._isLoadingLevels.asReadonly();

  private readonly _isLoadingSubjects = signal<boolean>(false);
  readonly isLoadingSubjects = this._isLoadingSubjects.asReadonly();

  private readonly _isLoadingUnits = signal<boolean>(false);
  readonly isLoadingUnits = this._isLoadingUnits.asReadonly();

  private readonly _isLoadingLessons = signal<boolean>(false);
  readonly isLoadingLessons = this._isLoadingLessons.asReadonly();

  private readonly _isLoadingOutcomes = signal<boolean>(false);
  readonly isLoadingOutcomes = this._isLoadingOutcomes.asReadonly();

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED - Derived State
  // ═══════════════════════════════════════════════════════════════════════════

  // Check if selection is complete
  readonly isSelectionComplete = computed(() => {
    return this._selectedLevel() !== null && this._selectedSubject() !== null;
  });

  // Summary from API
  private readonly _unitsSummary = signal<UnitsSummary | null>(null);
  readonly unitsSummary = this._unitsSummary.asReadonly();

  private readonly _outcomesSummary = signal<OutcomesSummary | null>(null);
  readonly outcomesSummary = this._outcomesSummary.asReadonly();

  // Total counts from summary
  readonly totalUnits = computed(() => this._unitsSummary()?.unitCount ?? 0);
  readonly totalLessons = computed(
    () => this._unitsSummary()?.lessonCount ?? 0,
  );
  readonly totalOutcomes = computed(
    () => this._unitsSummary()?.learningOutcomeCount ?? 0,
  );

  constructor() {}

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE UPDATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  updateSelectedLevel(level: LearningOutcomeLevel | null) {
    this._selectedLevel.set(level);
    // Clear subject when level changes
    if (level === null) {
      this._selectedSubject.set(null);
      this._subjects.set([]);
    }
  }

  updateSelectedSubject(subject: LearningOutcomeSubject | null) {
    this._selectedSubject.set(subject);
  }

  updateLevels(levels: LearningOutcomeLevel[]) {
    this._levels.set(levels);
  }

  updateSubjects(subjects: LearningOutcomeSubject[]) {
    this._subjects.set(subjects);
  }

  updateUnits(units: LearningOutcomeUnit[]) {
    this._units.set(units);
  }

  updateLessons(lessons: LearningOutcomeLesson[]) {
    this._lessons.set(lessons);
  }

  updateOutcomes(outcomes: LearningOutcome[]) {
    this._outcomes.set(outcomes);
  }

  updateSubjectOutcomesSummary(summary: LearningOutcomeSubjectSummary | null) {
    this._subjectOutcomesSummary.set(summary);
  }

  /**
   * Add a unit locally (without refetching)
   * Updates both the units array and the summary counts
   */
  addUnit(unit: LearningOutcomeUnit) {
    this._units.update((units) => [...units, unit]);

    // Update summary counts
    this._unitsSummary.update((summary) =>
      summary
        ? {
            ...summary,
            unitCount: summary.unitCount + 1,
          }
        : summary,
    );
  }

  /**
   * Update a unit locally (without refetching)
   * Preserves the unit's lessons array
   */
  updateUnitLocally(updatedUnit: LearningOutcomeUnit) {
    this._units.update((units) =>
      units.map((unit) =>
        unit.id === updatedUnit.id
          ? {
              ...updatedUnit,
              // Preserve existing lessons since API response may not include them
              lessons: unit.lessons,
              lessonCount: unit.lessonCount,
            }
          : unit,
      ),
    );
  }

  /**
   * Add a lesson to a specific unit locally (without refetching)
   * Updates both the unit's lessons array and the summary counts
   */
  addLessonToUnit(unitId: number, lesson: LearningOutcomeLesson) {
    this._units.update((units) =>
      units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              lessons: [...unit.lessons, lesson],
              lessonCount: unit.lessonCount + 1,
            }
          : unit,
      ),
    );

    // Update summary counts
    this._unitsSummary.update((summary) =>
      summary
        ? {
            ...summary,
            lessonCount: summary.lessonCount + 1,
          }
        : summary,
    );
  }

  /**
   * Update a lesson locally within a unit (without refetching)
   */
  updateLessonInUnit(unitId: number, updatedLesson: LearningOutcomeLesson) {
    this._units.update((units) =>
      units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              lessons: unit.lessons.map((lesson) =>
                lesson.id === updatedLesson.id
                  ? { ...updatedLesson, outcomesCount: lesson.outcomesCount }
                  : lesson,
              ),
            }
          : unit,
      ),
    );
  }

  /**
   * Remove a unit locally (without refetching)
   */
  removeUnitLocally(unitId: number) {
    this._units.update((units) => units.filter((unit) => unit.id !== unitId));

    // Update summary counts
    this._unitsSummary.update((summary) =>
      summary
        ? {
            ...summary,
            unitCount: summary.unitCount - 1,
          }
        : summary,
    );
  }

  /**
   * Remove a lesson from a unit locally (without refetching)
   */
  removeLessonFromUnit(unitId: number, lessonId: number) {
    this._units.update((units) =>
      units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              lessons: unit.lessons.filter((lesson) => lesson.id !== lessonId),
              lessonCount: unit.lessonCount - 1,
            }
          : unit,
      ),
    );

    // Update summary counts
    this._unitsSummary.update((summary) =>
      summary
        ? {
            ...summary,
            lessonCount: summary.lessonCount - 1,
          }
        : summary,
    );
  }

  // Clear all state
  clearSelection() {
    this._selectedLevel.set(null);
    this._selectedSubject.set(null);
    this._subjects.set([]);
    this._units.set([]);
    this._unitsSummary.set(null);
    this._lessons.set([]);
    this._outcomes.set([]);
    this._subjectOutcomesSummary.set(null);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVELS & SUBJECTS APIs
  // GET /learning-outcomes/levels
  // GET /learning-outcomes/subjects
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fetch all levels for learning outcomes
   * GET /v2/learning-outcomes/levels
   */
  fetchLevels(): Observable<LearningOutcomeLevel[]> {
    this._isLoadingLevels.set(true);
    return this.http
      .get<
        IResponse<LearningOutcomeLevelDTO[]>
      >(`${ApiUrl.v2BE}/learning-outcomes/levels`)
      .pipe(
        map((res) => {
          const levels = LEARNING_OUTCOMES_MAP_FROM_DTO.levels(res.data);
          this._levels.set(levels);
          return levels;
        }),
        finalize(() => this._isLoadingLevels.set(false)),
      );
  }

  /**
   * Fetch subjects for a specific level
   * GET /v2/learning-outcomes/subjects?levelId={levelId}
   */
  fetchSubjects(levelId: number): Observable<LearningOutcomeSubject[]> {
    this._isLoadingSubjects.set(true);
    return this.http
      .get<
        IResponse<LearningOutcomeSubjectDTO[]>
      >(`${ApiUrl.v2BE}/learning-outcomes/subjects`, { params: { levelId } })
      .pipe(
        map((res) => {
          const subjects = LEARNING_OUTCOMES_MAP_FROM_DTO.subjects(res.data);
          this._subjects.set(subjects);
          return subjects;
        }),
        finalize(() => this._isLoadingSubjects.set(false)),
      );
  }

  /**
   * Fetch a single subject by ID
   * GET /v1/subjects/{subjectId}
   */
  fetchSubjectById(subjectId: number): Observable<LearningOutcomeSubject> {
    return this.http
      .get<
        IResponse<LearningOutcomeSubjectDTO>
      >(`${ApiUrl.v1BE}/subjects/${subjectId}`)
      .pipe(
        map((res) => {
          const subject = LEARNING_OUTCOMES_MAP_FROM_DTO.subject(res.data);
          this._selectedSubject.set(subject);
          return subject;
        }),
      );
  }

  /**
   * Fetch all domains
   * GET /v2/domains
   */
  fetchDomains(): Observable<OutcomeDomain[]> {
    return this.http
      .get<IResponse<LearningOutcomeDomainDTO[]>>(`${ApiUrl.v2BE}/domains`)
      .pipe(
        map((res) => {
          const domains = LEARNING_OUTCOMES_MAP_FROM_DTO.domains(res.data);
          this._domains.set(domains);
          return domains;
        }),
      );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UNITS APIs
  // GET    /units/
  // POST   /units/
  // GET    /units/{unitId}
  // PUT    /units/{unitId}
  // DELETE /units/{unitId}
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fetch units with summary for a subject and level
   * GET /v2/units/?subjectIds[0]={subjectId}&levelIds[0]={levelId}&paginate=false
   */
  fetchUnits(params: {
    subjectId: number;
    levelId: number;
  }): Observable<UnitsWithSummary> {
    this._isLoadingUnits.set(true);
    return this.http
      .get<IResponse<FetchUnitsResponseDTO>>(`${ApiUrl.v2BE}/units/`, {
        params: {
          'subjectIds[0]': params.subjectId,
          'levelIds[0]': params.levelId,
          paginate: false,
        },
      })
      .pipe(
        map((res) => {
          const result = LEARNING_OUTCOMES_MAP_FROM_DTO.unitsWithSummary(
            res.data,
          );
          this._unitsSummary.set(result.summary);
          this._units.set(result.units);
          return result;
        }),
        finalize(() => this._isLoadingUnits.set(false)),
      );
  }

  /**
   * Create a new unit
   * POST /v2/units/
   */
  createUnit(payload: AddUnitPayload): Observable<LearningOutcomeUnit> {
    return this.http
      .post<IResponse<LearningOutcomeUnitDTO>>(`${ApiUrl.v2BE}/units/`, payload)
      .pipe(map((res) => LEARNING_OUTCOMES_MAP_FROM_DTO.unit(res.data)));
  }

  /**
   * Get a specific unit by ID
   * GET /v2/units/{unitId}
   */
  fetchUnitById(unitId: number): Observable<LearningOutcomeUnit> {
    return this.http
      .get<IResponse<LearningOutcomeUnitDTO>>(`${ApiUrl.v2BE}/units/${unitId}`)
      .pipe(map((res) => LEARNING_OUTCOMES_MAP_FROM_DTO.unit(res.data)));
  }

  /**
   * Update an existing unit
   * PUT /v2/units/{unitId}
   */
  updateUnit(
    unitId: number,
    payload: AddUnitPayload,
  ): Observable<LearningOutcomeUnit> {
    return this.http
      .put<
        IResponse<LearningOutcomeUnitDTO>
      >(`${ApiUrl.v2BE}/units/${unitId}`, payload)
      .pipe(map((res) => LEARNING_OUTCOMES_MAP_FROM_DTO.unit(res.data)));
  }

  /**
   * Delete a unit
   * DELETE /v2/units/{unitId}
   */
  deleteUnit(unitId: number): Observable<void> {
    return this.http.delete<void>(`${ApiUrl.v2BE}/units/${unitId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LESSONS APIs
  // GET    /lessons/
  // POST   /lessons/
  // GET    /lessons/{lessonId}
  // PUT    /lessons/{lessonId}
  // DELETE /lessons/{lessonId}
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fetch lessons by level and subject
   * GET /v2/lessons/?subjectIds[0]={subjectId}&levelIds[0]={levelId}&paginate=false
   */
  fetchLessons(params: {
    levelId: number;
    subjectId: number;
  }): Observable<LearningOutcomeLesson[]> {
    this._isLoadingLessons.set(true);
    return this.http
      .get<IResponse<FetchLessonsResponseDTO>>(`${ApiUrl.v2BE}/lessons/`, {
        params: {
          'subjectIds[0]': params.subjectId,
          'levelIds[0]': params.levelId,
          paginate: false,
        },
      })
      .pipe(
        map((res) => {
          const lessons = LEARNING_OUTCOMES_MAP_FROM_DTO.lessons(
            res.data.lessons,
          );
          this._lessons.set(lessons);
          return lessons;
        }),
        finalize(() => this._isLoadingLessons.set(false)),
      );
  }

  /**
   * Create a new lesson
   * POST /v2/lessons/
   */
  createLesson(payload: AddLessonPayload): Observable<LearningOutcomeLesson> {
    return this.http
      .post<
        IResponse<LearningOutcomeLessonDTO>
      >(`${ApiUrl.v2BE}/lessons/`, payload)
      .pipe(map((res) => LEARNING_OUTCOMES_MAP_FROM_DTO.lesson(res.data)));
  }

  /**
   * Get a specific lesson by ID
   * GET /v2/lessons/{lessonId}
   */
  fetchLessonById(lessonId: number): Observable<LessonDetail> {
    return this.http
      .get<IResponse<LessonDetailDTO>>(`${ApiUrl.v2BE}/lessons/${lessonId}`)
      .pipe(
        map((res) => {
          const lesson = LEARNING_OUTCOMES_MAP_FROM_DTO.lessonDetail(res.data);
          this._selectedLesson.set(lesson);
          return lesson;
        }),
      );
  }

  /**
   * Update an existing lesson
   * PUT /v2/lessons/{lessonId}
   */
  updateLesson(
    lessonId: number,
    payload: AddLessonPayload,
  ): Observable<LearningOutcomeLesson> {
    return this.http
      .put<
        IResponse<LearningOutcomeLessonDTO>
      >(`${ApiUrl.v2BE}/lessons/${lessonId}`, payload)
      .pipe(map((res) => LEARNING_OUTCOMES_MAP_FROM_DTO.lesson(res.data)));
  }

  /**
   * Delete a lesson
   * DELETE /v2/lessons/{lessonId}
   */
  deleteLesson(lessonId: number): Observable<void> {
    return this.http.delete<void>(`${ApiUrl.v2BE}/lessons/${lessonId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEARNING OUTCOMES APIs
  // GET    /learning-outcomes/
  // POST   /learning-outcomes/
  // GET    /learning-outcomes/{learningOutcomeId}
  // PUT    /learning-outcomes/{learningOutcomeId}
  // DELETE /learning-outcomes/{learningOutcomeId}
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fetch learning outcomes for a lesson
   * GET /v2/learning-outcomes/?lessonIds[0]={lessonId}&paginate=false
   */
  fetchOutcomes(params: { lessonId: number }): Observable<OutcomesWithSummary> {
    this._isLoadingOutcomes.set(true);
    return this.http
      .get<IResponse<FetchOutcomesResponseDTO>>(
        `${ApiUrl.v2BE}/learning-outcomes/`,
        {
          params: {
            'lessonIds[0]': params.lessonId,
            paginate: false,
          },
        },
      )
      .pipe(
        map((res) => {
          const result = LEARNING_OUTCOMES_MAP_FROM_DTO.outcomesWithSummary(
            res.data,
          );
          this._outcomesSummary.set(result.summary);
          this._outcomes.set(result.outcomes);
          return result;
        }),
        finalize(() => this._isLoadingOutcomes.set(false)),
      );
  }

  /**
   * Create a new learning outcome
   * POST /v2/learning-outcomes/
   */
  createOutcome(payload: AddOutcomePayload): Observable<LearningOutcome> {
    return this.http
      .post<
        IResponse<LearningOutcomeDTO>
      >(`${ApiUrl.v2BE}/learning-outcomes/`, payload)
      .pipe(map((res) => LEARNING_OUTCOMES_MAP_FROM_DTO.outcome(res.data)));
  }

  /**
   * Get a specific learning outcome by ID
   * GET /learning-outcomes/{learningOutcomeId}
   */
  fetchOutcomeById(outcomeId: number): Observable<LearningOutcomeDetail> {
    return this.http
      .get<
        IResponse<LearningOutcomeDetailDTO>
      >(`${ApiUrl.v2BE}/learning-outcomes/${outcomeId}`)
      .pipe(
        map((res) => LEARNING_OUTCOMES_MAP_FROM_DTO.outcomeDetail(res.data)),
      );
  }

  /**
   * Update an existing learning outcome
   * PUT /learning-outcomes/{learningOutcomeId}
   */
  updateOutcome(
    outcomeId: number,
    payload: AddOutcomePayload,
  ): Observable<LearningOutcome> {
    return this.http
      .put<
        IResponse<LearningOutcomeDTO>
      >(`${ApiUrl.v2BE}/learning-outcomes/${outcomeId}`, payload)
      .pipe(map((res) => LEARNING_OUTCOMES_MAP_FROM_DTO.outcome(res.data)));
  }

  /**
   * Delete a learning outcome
   * DELETE /v2/learning-outcomes/{learningOutcomeId}
   */
  deleteOutcome(outcomeId: number): Observable<void> {
    return this.http.delete<void>(
      `${ApiUrl.v2BE}/learning-outcomes/${outcomeId}`,
    );
  }

  /**
   * Remove an outcome locally (without refetching)
   * Updates both outcomesSummary and unitsSummary counts
   */
  removeOutcomeLocally(outcomeId: number) {
    this._outcomes.update((outcomes) =>
      outcomes.filter((outcome) => outcome.id !== outcomeId),
    );

    // Update outcomes summary counts
    this._outcomesSummary.update((summary) =>
      summary
        ? {
            ...summary,
            learningOutcomeCount: summary.learningOutcomeCount - 1,
          }
        : summary,
    );

    // Update units summary counts (for subject-outcomes page stats)
    this._unitsSummary.update((summary) =>
      summary
        ? {
            ...summary,
            learningOutcomeCount: summary.learningOutcomeCount - 1,
          }
        : summary,
    );
  }

  /**
   * Increment outcome count locally after creating an outcome
   * Updates both outcomesSummary and unitsSummary counts
   */
  incrementOutcomeCount() {
    // Update outcomes summary counts
    this._outcomesSummary.update((summary) =>
      summary
        ? {
            ...summary,
            learningOutcomeCount: summary.learningOutcomeCount + 1,
          }
        : summary,
    );

    // Update units summary counts (for subject-outcomes page stats)
    this._unitsSummary.update((summary) =>
      summary
        ? {
            ...summary,
            learningOutcomeCount: summary.learningOutcomeCount + 1,
          }
        : summary,
    );
  }
}
