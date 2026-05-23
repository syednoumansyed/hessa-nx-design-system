import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { AuthService } from '@auth/auth.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';

interface EmptyStateConfig {
  mainImagePath: string;
  title: string;
  description: string;
  secondaryButton: {
    label: string;
    onAction: () => void;
  };
  primaryButton: {
    label: string;
    onAction: () => void;
    variant?: 'primary' | 'secondary' | 'tertiary';
  };
}

@Component({
  selector: 'app-home-empty-state',
  standalone: true,
  imports: [NoDataCardComponent, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <app-no-data-card
        [mainImagePath]="config().mainImagePath"
        [title]="t(config().title)"
        [description]="t(config().description)"
        [primaryButton]="{
          label: t(config().primaryButton.label),
          onAction: config().primaryButton.onAction,
          variant: config().primaryButton.variant,
        }"
        [secondaryButton]="{
          label: t(config().secondaryButton.label),
          onAction: config().secondaryButton.onAction,
        }"
      />
    </ng-container>
  `,
  host: { class: 'block w-full mb-40 lg:mb-0' },
})
export class HomeEmptyStateComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly studentSelectionScopeService = inject(
    StudentSelectionScopeService,
  );
  private readonly rbacService = inject(RoleBaseAccessControlService);

  /**
   * Computes the appropriate empty state configuration based on user type:
   * - Student: "not part of any class" message
   * - Guardian (no students): "no students linked" message
   * - Guardian (students, no class): "students not in class" message
   * - Teacher-only personnel: "not part of any course" message
   * - Other personnel: "not part of any school" message
   */
  config = computed<EmptyStateConfig>(() => {
    const isStudent = this.auth.isUserStudent();
    const isGuardian = this.auth.isUserGuardian();
    const isTeacherOnly = this.rbacService.isTeacherOnly();

    if (isStudent) {
      return {
        mainImagePath: 'assets/illustrations/no_data.svg',
        title: 'home.student_no_class.title',
        description: 'home.student_no_class.description',
        secondaryButton: {
          label: 'home.teacher_no_courses.view_faqs.btn',
          onAction: () => this.router.navigate(['/help-center/faqs']),
        },
        primaryButton: {
          label: 'home.teacher_no_courses.view_user_manual.btn',
          onAction: () => this.router.navigate(['/help-center/user-manual']),
          variant: 'secondary',
        },
      };
    }

    if (isGuardian) {
      const hasStudentsLinked =
        this.studentSelectionScopeService.studentSelectionScope().length > 0;

      if (!hasStudentsLinked) {
        // Guardian has NO students linked at all
        return {
          mainImagePath: 'assets/illustrations/no_data.svg',
          title: 'home.guardian_no_students.title',
          description: 'home.guardian_no_students.description',
          secondaryButton: {
            label: 'home.teacher_no_courses.view_faqs.btn',
            onAction: () => this.router.navigate(['/help-center/faqs']),
          },
          primaryButton: {
            label: 'home.teacher_no_courses.view_user_manual.btn',
            onAction: () => this.router.navigate(['/help-center/user-manual']),
            variant: 'secondary',
          },
        };
      }

      // Guardian has students but they're not in any class this year
      return {
        mainImagePath: 'assets/illustrations/no_data.svg',
        title: 'home.guardian_no_class.title',
        description: 'home.guardian_no_class.description',
        secondaryButton: {
          label: 'home.teacher_no_courses.view_faqs.btn',
          onAction: () => this.router.navigate(['/help-center/faqs']),
        },
        primaryButton: {
          label: 'home.teacher_no_courses.view_user_manual.btn',
          onAction: () => this.router.navigate(['/help-center/user-manual']),
          variant: 'secondary',
        },
      };
    }

    if (isTeacherOnly) {
      // Teacher-only: course messaging
      return {
        mainImagePath: 'assets/illustrations/no_data.svg',
        title: 'home.teacher_no_courses.title',
        description: 'home.teacher_no_courses.description',
        secondaryButton: {
          label: 'home.teacher_no_courses.view_faqs.btn',
          onAction: () => this.router.navigate(['/help-center/faqs']),
        },
        primaryButton: {
          label: 'home.teacher_no_courses.view_user_manual.btn',
          onAction: () => this.router.navigate(['/help-center/user-manual']),
          variant: 'secondary',
        },
      };
    }

    // Other personnel (guard, admin, etc.): school messaging
    return {
      mainImagePath: 'assets/illustrations/no_data.svg',
      title: 'home.personnel_no_school.title',
      description: 'home.personnel_no_school.description',
      secondaryButton: {
        label: 'home.teacher_no_courses.view_faqs.btn',
        onAction: () => this.router.navigate(['/help-center/faqs']),
      },
      primaryButton: {
        label: 'home.teacher_no_courses.view_user_manual.btn',
        onAction: () => this.router.navigate(['/help-center/user-manual']),
        variant: 'secondary',
      },
    };
  });
}
