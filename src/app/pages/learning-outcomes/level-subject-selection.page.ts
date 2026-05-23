import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LayoutService } from '@layout/layout.service';
import { LearningOutcomesService } from './data-access/learning-outcomes.service';
import { LearningOutcomeSubject } from './data-access/learning-outcomes.interface';
import { DsSelectComponent } from '@ds/select/select.component';
import { DsSelectConfig } from '@ds/select/select.interface';
import { DsButtonComponent } from '@ds/button/button.component';
import { LoEmptyStateComponent } from './components/empty-state/empty-state.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

@Component({
  selector: 'app-level-subject-selection',
  templateUrl: './level-subject-selection.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    ReactiveFormsModule,
    DsSelectComponent,
    DsButtonComponent,
    LoEmptyStateComponent,
    TranslocoDirective,
    RbacDirective,
  ],
})
export class LevelSubjectSelectionPage implements OnInit {
  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);
  private readonly learningOutcomesService = inject(LearningOutcomesService);
  private readonly hesTranslateService = inject(HesTranslateService);

  // Layout
  readonly isMobile = this.layoutService.isMobile;

  // Form control for level selection
  levelControl = new FormControl<number | null>(null);

  // Expose service signals to template
  readonly selectedLevel = this.learningOutcomesService.selectedLevel;
  readonly selectedSubject = this.learningOutcomesService.selectedSubject;
  readonly levels = this.learningOutcomesService.levels;
  readonly subjects = this.learningOutcomesService.subjects;
  readonly isSelectionComplete =
    this.learningOutcomesService.isSelectionComplete;

  // Check if level is selected (for showing subjects grid vs empty state)
  readonly isLevelSelected = computed(() => this.selectedLevel() !== null);

  // Check if Next button should be disabled
  readonly isNextDisabled = computed(() => !this.isSelectionComplete());

  // Loading states
  readonly isLoadingLevels = this.learningOutcomesService.isLoadingLevels;
  readonly isLoadingSubjects = this.learningOutcomesService.isLoadingSubjects;

  // RBAC Permissions
  readonly listUnitsPermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.READ.LIST_UNITS;

  // Level select config
  readonly levelSelectConfig = computed<DsSelectConfig>(() => ({
    label: this.hesTranslateService.t('global.level.label'),
    placeholder: this.hesTranslateService.t('global.select_level.dropdown'),
    required: true,
    showSearch: false,
    chips: false,
    options: this.levels().map((level) => ({
      id: level.id,
      display: level.displayName,
    })),
  }));

  ngOnInit() {
    // Listen to level selection changes
    this.levelControl.valueChanges.subscribe((levelId) => {
      if (levelId) {
        const level = this.levels().find((l) => l.id === levelId) || null;
        this.learningOutcomesService.updateSelectedLevel(level);
        // Fetch subjects for selected level
        this.learningOutcomesService.fetchSubjects(levelId).subscribe();
      } else {
        this.learningOutcomesService.updateSelectedLevel(null);
      }
    });
  }

  // Ionic lifecycle hook - fires every time the view becomes active
  ionViewWillEnter() {
    // Reset all state when entering this page
    this.learningOutcomesService.clearSelection();
    this.levelControl.reset();

    // Fetch levels from API
    this.learningOutcomesService.fetchLevels().subscribe();
  }

  onNext() {
    const level = this.selectedLevel();
    const subject = this.selectedSubject();
    if (level && subject) {
      this.router.navigate([
        '/learning-outcomes/subject',
        level.id,
        subject.id,
      ]);
    }
  }

  onSubjectSelect(subject: LearningOutcomeSubject) {
    this.learningOutcomesService.updateSelectedSubject(subject);
  }
}
