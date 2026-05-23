import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LayoutService } from '@layout/layout.service';
import { LearningOutcomesService } from '../../data-access/learning-outcomes.service';
import { DsButtonComponent } from '@ds/button/button.component';
import {
  OutcomeCardComponent,
  OutcomeCardData,
} from '../../components/outcome-card/outcome-card.component';
import { LearningOutcome } from '../../data-access/learning-outcomes.interface';
import { LoEmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { DsModalService } from '@ds/modal/modal.service';
import { ManageOutcomeModalComponent } from '../../components/manage-outcome-modal/manage-outcome-modal.component';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

@Component({
  selector: 'app-learning-outcome-management',
  templateUrl: './learning-outcome-management.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    DsButtonComponent,
    OutcomeCardComponent,
    LoEmptyStateComponent,
    TranslocoDirective,
    RbacDirective,
  ],
})
export class LearningOutcomeManagementPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly layoutService = inject(LayoutService);
  private readonly learningOutcomesService = inject(LearningOutcomesService);
  private readonly modalService = inject(DsModalService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly hesToaster = inject(HesToasterService);
  private readonly hesTranslateService = inject(HesTranslateService);

  // Layout
  readonly isMobile = this.layoutService.isMobile;

  // Route params
  levelId: number | null = null;
  subjectId: number | null = null;
  lessonId: number | null = null;

  // Expose service signals to template
  readonly outcomes = this.learningOutcomesService.outcomes;
  readonly isLoadingOutcomes = this.learningOutcomesService.isLoadingOutcomes;
  readonly outcomesSummary = this.learningOutcomesService.outcomesSummary;
  readonly selectedLesson = this.learningOutcomesService.selectedLesson;
  readonly lessons = this.learningOutcomesService.lessons;

  // RBAC Permissions
  readonly createOutcomePermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.CREATE.CREATE_LEARNING_OUTCOMES;

  // Map domain outcomes to card data
  readonly outcomeCards = computed<OutcomeCardData[]>(() =>
    this.outcomes().map((outcome) => this.toOutcomeCardData(outcome)),
  );

  ngOnInit() {
    // levelId and subjectId are in parent route (subject/:levelId/:subjectId)
    // lessonId is in current route (lesson/:lessonId)
    const parentParams = this.route.snapshot.parent?.paramMap;
    this.levelId = Number(parentParams?.get('levelId'));
    this.subjectId = Number(parentParams?.get('subjectId'));
    this.lessonId = Number(this.route.snapshot.paramMap.get('lessonId'));

    if (this.lessonId) {
      // Fetch lesson info if not already in state (direct navigation)
      if (
        !this.selectedLesson() ||
        this.selectedLesson()?.id !== this.lessonId
      ) {
        this.learningOutcomesService.fetchLessonById(this.lessonId).subscribe();
      }

      // Fetch outcomes
      this.learningOutcomesService
        .fetchOutcomes({ lessonId: this.lessonId })
        .subscribe();
    }
  }

  // Map domain outcome to card data
  toOutcomeCardData(outcome: LearningOutcome): OutcomeCardData {
    return {
      id: outcome.id,
      statement: outcome.displayStatement,
      educationalPaths: outcome.educationalPaths,
      domains: outcome.domains,
    };
  }

  goBack() {
    // Navigate to parent route (unit-lesson-management page)
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  /**
   * Refetch units to update lesson outcome counts on subject-outcomes page
   */
  private refetchUnits() {
    if (this.levelId && this.subjectId) {
      this.learningOutcomesService
        .fetchUnits({ levelId: this.levelId, subjectId: this.subjectId })
        .subscribe();
    }
  }

  async onAddOutcome() {
    const lessonName =
      this.selectedLesson()?.displayName ??
      this.hesTranslateService.t('learning_outcome.lesson.txt');

    const modalRef = await this.modalService.open({
      component: ManageOutcomeModalComponent,
      componentProps: {
        lessonId: this.lessonId,
        levelId: this.levelId,
        subjectId: this.subjectId,
      },
      headerConfig: {
        title: this.hesTranslateService.t('learning_outcome.add_outcome.title'),
        subtitle: this.hesTranslateService.t(
          'learning_outcome.in_subject.txt',
          { name: lessonName },
        ),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: this.hesTranslateService.t('global.add') },
      },
      size: 'lg',
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'confirm' && result.data) {
      const { action } = result.data as {
        outcome: LearningOutcome;
        action: 'create' | 'update';
      };
      if (action === 'create') {
        // Refresh outcomes list and units (for lesson outcome counts)
        this.learningOutcomesService
          .fetchOutcomes({ lessonId: this.lessonId! })
          .subscribe();
        this.refetchUnits();
      }
    }
  }

  async onEditOutcome(outcomeId: number) {
    const lessonName =
      this.selectedLesson()?.displayName ??
      this.hesTranslateService.t('learning_outcome.lesson.txt');

    const modalRef = await this.modalService.open({
      component: ManageOutcomeModalComponent,
      componentProps: {
        lessonId: this.lessonId,
        levelId: this.levelId,
        subjectId: this.subjectId,
        outcomeId,
      },
      headerConfig: {
        title: this.hesTranslateService.t(
          'learning_outcome.edit_outcome_modal.title',
        ),
        subtitle: this.hesTranslateService.t(
          'learning_outcome.in_subject.txt',
          { name: lessonName },
        ),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: this.hesTranslateService.t('global.save.btn') },
      },
      size: 'lg',
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'confirm' && result.data) {
      const { action } = result.data as {
        outcome: LearningOutcome;
        action: 'create' | 'update';
      };
      if (action === 'update') {
        // Refresh outcomes list and units (lessons may have changed)
        this.learningOutcomesService
          .fetchOutcomes({ lessonId: this.lessonId! })
          .subscribe();
        this.refetchUnits();
      }
    }
  }

  async onDeleteOutcome(outcomeId: number) {
    const outcomeToDelete = this.outcomes().find((o) => o.id === outcomeId);
    if (!outcomeToDelete) return;

    const confirmed = await this.feedbackService.openFeedbackModal({
      type: 'error',
      modalTitle: this.hesTranslateService.t(
        'learning_outcome.delete_outcome.title',
      ),
      modalMessage: this.hesTranslateService.t(
        'learning_outcome.delete_outcome.msg',
      ),
      primaryBtnStr: this.hesTranslateService.t('global.delete.btn'),
      secondaryBtnStr: this.hesTranslateService.t('global.cancel.btn'),
    });

    if (confirmed) {
      this.learningOutcomesService.deleteOutcome(outcomeId).subscribe({
        next: () => {
          this.hesToaster.success(
            this.hesTranslateService.t('learning_outcome.outcome_deleted.msg'),
          );
          this.learningOutcomesService.removeOutcomeLocally(outcomeId);
          this.refetchUnits();
        },
        error: (err) => {
          this.hesToaster.showBackendError(err);
        },
      });
    }
  }
}
