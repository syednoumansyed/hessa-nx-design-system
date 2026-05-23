import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsResponsiveMenuComponent } from '@ds/popup/responsive-menu/responsive-menu.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import {
  faEdit,
  faTrash,
  faChevronRight,
} from '@fortawesome/pro-regular-svg-icons';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { isRtl } from '@shared/utils/platform';

export interface LessonCardData {
  id: number;
  name: string;
  outcomesCount: number;
}

@Component({
  selector: 'app-lesson-card',
  templateUrl: './lesson-card.component.html',
  styleUrls: ['./lesson-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DsResponsiveMenuComponent,
    DsIconComponent,
    TranslocoDirective,
  ],
})
export class LessonCardComponent {
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  // RBAC Permissions
  private readonly updateLessonPermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.UPDATE.UPDATE_LESSONS;
  private readonly deleteLessonPermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.DELETE.DELETE_LESSONS;

  @Input() lesson!: LessonCardData;

  @Output() viewOutcomes = new EventEmitter<number>();
  @Output() editLesson = new EventEmitter<number>();
  @Output() deleteLesson = new EventEmitter<number>();

  readonly faChevronRight = faChevronRight;
  readonly isRtl = isRtl();

  get menuItems(): PopupItem[] {
    const items: PopupItem[] = [];

    // Edit lesson - requires UPDATE_LESSONS permission
    if (this.rbacService.hasPermission(this.updateLessonPermissionId)) {
      items.push({
        id: 'edit',
        title: this.hesTranslateService.t('learning_outcome.edit_lesson.title'),
        icon: faEdit,
        action: () => this.onEditLesson(),
      });
    }

    // Delete lesson - requires DELETE_LESSONS permission and lesson must have no outcomes
    if (
      this.lesson.outcomesCount === 0 &&
      this.rbacService.hasPermission(this.deleteLessonPermissionId)
    ) {
      items.push({
        id: 'delete',
        title: this.hesTranslateService.t(
          'learning_outcome.delete_lesson.title',
        ),
        icon: faTrash,
        state: 'danger',
        action: () => this.onDeleteLesson(),
      });
    }

    return items;
  }

  get hasMenuItems(): boolean {
    return this.menuItems.length > 0;
  }

  onViewOutcomes() {
    this.viewOutcomes.emit(this.lesson.id);
  }

  onEditLesson() {
    this.editLesson.emit(this.lesson.id);
  }

  onDeleteLesson() {
    this.deleteLesson.emit(this.lesson.id);
  }
}
