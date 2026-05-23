import { Routes } from '@angular/router';
import { LearningOutcomesService } from './data-access/learning-outcomes.service';
import { rbacGuard } from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

export const LearningOutcomesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./level-subject-selection.page').then(
            (m) => m.LevelSubjectSelectionPage,
          ),
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.LEARNING_OUTCOMES.READ.LIST_UNITS),
        ],
        data: { breadcrumb: 'learning_outcome.select_level_subject.title' },
      },
      {
        path: 'subject/:levelId/:subjectId',
        data: { breadcrumb: 'learning_outcome.unit_and_lesson.title' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/unit-lesson-management/unit-lesson-management.page').then(
                (m) => m.UnitLessonManagementPage,
              ),
            canActivate: [
              rbacGuard(RESOURCE_PERMISSION.LEARNING_OUTCOMES.READ.LIST_UNITS),
            ],
          },
          {
            path: 'lesson/:lessonId',
            loadComponent: () =>
              import('./pages/learning-outcome-management/learning-outcome-management.page').then(
                (m) => m.LearningOutcomeManagementPage,
              ),
            canActivate: [
              rbacGuard(
                RESOURCE_PERMISSION.LEARNING_OUTCOMES.READ
                  .LIST_LEARNING_OUTCOMES,
              ),
            ],
            data: { breadcrumb: 'resource.learning_outcome' },
          },
        ],
      },
    ],
    providers: [LearningOutcomesService],
  },
];
