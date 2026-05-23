import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LayoutService } from '@layout/layout.service';
import { LearningOutcomesService } from '../../data-access/learning-outcomes.service';
import {
  DsAccordionComponent,
  DsAccordionGroupComponent,
  DsAccordionTag,
  DsAccordionMenuItem,
} from '@ds/accordion';
import { faEdit, faTrash } from '@fortawesome/pro-regular-svg-icons';
import {
  LessonCardComponent,
  LessonCardData,
} from '../../components/lesson-card/lesson-card.component';
import { DsButtonComponent } from '@ds/button/button.component';
import {
  LearningOutcomeUnit,
  LearningOutcomeLesson,
} from '../../data-access/learning-outcomes.interface';
import { LoEmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { DsModalService } from '@ds/modal/modal.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { ManageUnitModalComponent } from '../../components/manage-unit-modal/manage-unit-modal.component';
import { ManageLessonModalComponent } from '../../components/manage-lesson-modal/manage-lesson-modal.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';

interface StatCard {
  label: string;
  value: number;
}

@Component({
  selector: 'app-unit-lesson-management',
  templateUrl: './unit-lesson-management.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    DsAccordionComponent,
    DsAccordionGroupComponent,
    LessonCardComponent,
    DsButtonComponent,
    LoEmptyStateComponent,
    TranslocoDirective,
    RbacDirective,
  ],
})
export class UnitLessonManagementPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly layoutService = inject(LayoutService);
  private readonly learningOutcomesService = inject(LearningOutcomesService);
  private readonly modalService = inject(DsModalService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly hesToaster = inject(HesToasterService);
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  // Layout
  readonly isMobile = this.layoutService.isMobile;

  // Route params
  levelId: number | null = null;
  subjectId: number | null = null;

  // Expose service signals to template
  readonly units = this.learningOutcomesService.units;
  readonly selectedSubject = this.learningOutcomesService.selectedSubject;
  readonly selectedLevel = this.learningOutcomesService.selectedLevel;
  readonly totalUnits = this.learningOutcomesService.totalUnits;
  readonly totalLessons = this.learningOutcomesService.totalLessons;
  readonly totalOutcomes = this.learningOutcomesService.totalOutcomes;

  // Loading state
  readonly isLoadingUnits = this.learningOutcomesService.isLoadingUnits;

  // RBAC Permissions
  readonly createUnitPermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.CREATE.CREATE_UNITS;
  readonly updateUnitPermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.UPDATE.UPDATE_UNITS;
  readonly deleteUnitPermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.DELETE.DELETE_UNITS;
  readonly createLessonPermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.CREATE.CREATE_LESSONS;
  readonly updateLessonPermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.UPDATE.UPDATE_LESSONS;
  readonly deleteLessonPermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.DELETE.DELETE_LESSONS;
  readonly listLessonsPermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.READ.LIST_LESSONS;
  readonly listOutcomesPermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.READ.LIST_LEARNING_OUTCOMES;

  // Check if user has permission to view lessons
  readonly canViewLessons = this.rbacService.hasPermission(
    this.listLessonsPermissionId,
  );

  // Check if user has permission to view learning outcomes
  readonly canViewOutcomes = this.rbacService.hasPermission(
    this.listOutcomesPermissionId,
  );

  // Stats cards configuration
  readonly statsCards = computed<StatCard[]>(() => [
    {
      label: this.hesTranslateService.t('learning_outcome.unit.txt'),
      value: this.totalUnits(),
    },
    {
      label: this.hesTranslateService.t('learning_outcome.lesson.txt'),
      value: this.totalLessons(),
    },
    {
      label: this.hesTranslateService.t('learning_outcome.outcomes.txt'),
      value: this.totalOutcomes(),
    },
  ]);

  // Get tags for unit accordion
  getUnitTags(unit: LearningOutcomeUnit): DsAccordionTag[] {
    return [
      {
        text: this.hesTranslateService.t('learning_outcome.lessons_count.txt', {
          count: unit.lessonCount,
        }),
      },
    ];
  }

  // Map domain lesson to lesson card data
  toLessonCardData(lesson: LearningOutcomeLesson): LessonCardData {
    return {
      id: lesson.id,
      name: lesson.displayName,
      outcomesCount: lesson.outcomesCount,
    };
  }

  // Get menu items for a specific unit (with RBAC checks)
  getUnitMenuItems(unit: LearningOutcomeUnit): DsAccordionMenuItem[] {
    const items: DsAccordionMenuItem[] = [];

    // Edit unit - requires UPDATE_UNITS permission
    if (this.rbacService.hasPermission(this.updateUnitPermissionId)) {
      items.push({
        id: 'edit',
        title: this.hesTranslateService.t('learning_outcome.edit_unit.title'),
        icon: faEdit,
        action: () => this.onEditUnit(unit),
      });
    }

    // Delete unit - requires DELETE_UNITS permission and unit must have no lessons
    if (
      unit.lessonCount === 0 &&
      this.rbacService.hasPermission(this.deleteUnitPermissionId)
    ) {
      items.push({
        id: 'delete',
        title: this.hesTranslateService.t('learning_outcome.delete_unit.title'),
        icon: faTrash,
        state: 'danger',
        action: () => this.onDeleteUnit(unit),
      });
    }

    return items;
  }

  ngOnInit() {
    this.levelId = Number(this.route.snapshot.paramMap.get('levelId'));
    this.subjectId = Number(this.route.snapshot.paramMap.get('subjectId'));

    if (this.levelId && this.subjectId) {
      // Fetch subject info if not already in state (direct navigation)
      if (!this.selectedSubject()) {
        this.learningOutcomesService
          .fetchSubjectById(this.subjectId)
          .subscribe();
      }

      // Fetch units data
      this.learningOutcomesService
        .fetchUnits({
          subjectId: this.subjectId,
          levelId: this.levelId,
        })
        .subscribe();
    }
  }

  goBack() {
    this.router.navigate(['/learning-outcomes']);
  }

  goToLessonOutcomes(lessonId: number) {
    // Only navigate if user has permission to view learning outcomes
    if (!this.canViewOutcomes) {
      return;
    }
    // Navigate to child route - lesson is now a child of subject/:levelId/:subjectId
    this.router.navigate(['lesson', lessonId], { relativeTo: this.route });
  }

  async onAddUnit() {
    const subjectName =
      this.selectedSubject()?.displayName ??
      this.hesTranslateService.t('global.subject.title');

    const modalRef = await this.modalService.open({
      component: ManageUnitModalComponent,
      componentProps: {
        subjectId: this.subjectId,
        levelId: this.levelId,
        subjectName,
      },
      headerConfig: {
        title: this.hesTranslateService.t('learning_outcome.add_unit.btn'),
        subtitle: this.hesTranslateService.t(
          'learning_outcome.in_subject.txt',
          { name: subjectName },
        ),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: {
          text: this.hesTranslateService.t('learning_outcome.add_unit.btn'),
        },
      },
      size: 'sm',
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'confirm' && result.data) {
      const { unit, action } = result.data as {
        unit: LearningOutcomeUnit;
        action: 'create' | 'update';
      };
      if (action === 'create') {
        this.learningOutcomesService.addUnit(unit);
      }
    }
  }

  async onEditUnit(unitToEdit: LearningOutcomeUnit) {
    const subjectName =
      this.selectedSubject()?.displayName ??
      this.hesTranslateService.t('global.subject.title');

    const modalRef = await this.modalService.open({
      component: ManageUnitModalComponent,
      componentProps: {
        subjectId: this.subjectId,
        levelId: this.levelId,
        subjectName,
        unit: unitToEdit,
        unitEnName: unitToEdit.enName,
        unitArName: unitToEdit.arName,
      },
      headerConfig: {
        title: this.hesTranslateService.t('learning_outcome.edit_unit.title'),
        subtitle: this.hesTranslateService.t(
          'learning_outcome.in_subject.txt',
          { name: subjectName },
        ),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: {
          text: this.hesTranslateService.t('learning_outcome.save_changes.btn'),
        },
      },
      size: 'sm',
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'confirm' && result.data) {
      const { unit, action } = result.data as {
        unit: LearningOutcomeUnit;
        action: 'create' | 'update';
      };
      if (action === 'update') {
        this.learningOutcomesService.updateUnitLocally(unit);
      }
    }
  }

  async onDeleteUnit(unit: LearningOutcomeUnit) {
    const confirmed = await this.feedbackService.openFeedbackModal({
      type: 'error',
      modalTitle: this.hesTranslateService.t(
        'learning_outcome.delete_unit.title',
      ),
      modalMessage: this.hesTranslateService.t(
        'learning_outcome.delete_unit.msg',
        { name: unit.displayName },
      ),
      primaryBtnStr: this.hesTranslateService.t('global.delete.btn'),
      secondaryBtnStr: this.hesTranslateService.t('global.cancel.btn'),
    });

    if (confirmed) {
      this.learningOutcomesService.deleteUnit(unit.id).subscribe({
        next: () => {
          this.hesToaster.success(
            this.hesTranslateService.t('learning_outcome.unit_deleted.msg'),
          );
          this.learningOutcomesService.removeUnitLocally(unit.id);
        },
        error: (err) => {
          this.hesToaster.showBackendError(err);
        },
      });
    }
  }

  async onAddLesson(unitId: number, unitName: string) {
    const modalRef = await this.modalService.open({
      component: ManageLessonModalComponent,
      componentProps: {
        unitId,
        unitName,
      },
      headerConfig: {
        title: this.hesTranslateService.t('learning_outcome.add_lesson.btn'),
        subtitle: this.hesTranslateService.t(
          'learning_outcome.in_subject.txt',
          { name: unitName },
        ),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: {
          text: this.hesTranslateService.t('learning_outcome.add_lesson.btn'),
        },
      },
      size: 'sm',
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'confirm' && result.data) {
      const {
        lesson,
        unitId: targetUnitId,
        action,
      } = result.data as {
        lesson: LearningOutcomeLesson;
        unitId: number;
        action: 'create' | 'update';
      };
      if (action === 'create') {
        this.learningOutcomesService.addLessonToUnit(targetUnitId, lesson);
      }
    }
  }

  async onEditLesson(lessonId: number, unitId: number, unitName: string) {
    // Find the lesson from units
    const unit = this.units().find((u) => u.id === unitId);
    const lessonToEdit = unit?.lessons.find((l) => l.id === lessonId);

    if (!lessonToEdit) return;

    const modalRef = await this.modalService.open({
      component: ManageLessonModalComponent,
      componentProps: {
        unitId,
        unitName,
        lesson: lessonToEdit,
      },
      headerConfig: {
        title: this.hesTranslateService.t('learning_outcome.edit_lesson.title'),
        subtitle: this.hesTranslateService.t(
          'learning_outcome.in_subject.txt',
          { name: unitName },
        ),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: {
          text: this.hesTranslateService.t('learning_outcome.save_changes.btn'),
        },
      },
      size: 'sm',
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'confirm' && result.data) {
      const {
        lesson,
        unitId: targetUnitId,
        action,
      } = result.data as {
        lesson: LearningOutcomeLesson;
        unitId: number;
        action: 'create' | 'update';
      };
      if (action === 'update') {
        this.learningOutcomesService.updateLessonInUnit(targetUnitId, lesson);
      }
    }
  }

  async onDeleteLesson(lessonId: number, unitId: number) {
    // Find the lesson from units
    const unit = this.units().find((u) => u.id === unitId);
    const lessonToDelete = unit?.lessons.find((l) => l.id === lessonId);

    if (!lessonToDelete) return;

    // Only allow delete if lesson has no outcomes
    if (lessonToDelete.outcomesCount > 0) {
      return;
    }

    const confirmed = await this.feedbackService.openFeedbackModal({
      type: 'error',
      modalTitle: this.hesTranslateService.t(
        'learning_outcome.delete_lesson.title',
      ),
      modalMessage: this.hesTranslateService.t(
        'learning_outcome.delete_lesson.msg',
        { name: lessonToDelete.displayName },
      ),
      primaryBtnStr: this.hesTranslateService.t('global.delete.btn'),
      secondaryBtnStr: this.hesTranslateService.t('global.cancel.btn'),
    });

    if (confirmed) {
      this.learningOutcomesService.deleteLesson(lessonId).subscribe({
        next: () => {
          this.hesToaster.success(
            this.hesTranslateService.t('learning_outcome.lesson_deleted.msg'),
          );
          this.learningOutcomesService.removeLessonFromUnit(unitId, lessonId);
        },
        error: (err) => {
          this.hesToaster.showBackendError(err);
        },
      });
    }
  }

  onAddOutcome() {
    // TODO: Open add outcome modal
    console.log('Add outcome clicked');
  }
}
