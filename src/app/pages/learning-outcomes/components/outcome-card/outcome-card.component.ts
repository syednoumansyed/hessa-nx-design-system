import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsResponsiveMenuComponent } from '@ds/popup/responsive-menu/responsive-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { faEdit, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoModule } from '@jsverse/transloco';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

export interface OutcomeCardDomain {
  id: number;
  displayName: string;
  color: string;
}

export interface OutcomeCardData {
  id: number;
  statement: string;
  educationalPaths: string[];
  domains: OutcomeCardDomain[];
}

// Color configuration for educational paths
const EDUCATIONAL_PATH_COLORS: Record<string, { bg: string; text: string }> = {
  NATIONAL: {
    bg: 'bg-pastels-magenta-400',
    text: 'text-white',
  },
  INTERNATIONAL: {
    bg: 'bg-pastels-blue-400',
    text: 'text-white',
  },
  ACADEMY: {
    bg: 'bg-pastels-emerald-400',
    text: 'text-white',
  },
};

@Component({
  selector: 'app-outcome-card',
  templateUrl: './outcome-card.component.html',
  styleUrls: ['./outcome-card.component.scss'],
  standalone: true,
  imports: [CommonModule, DsResponsiveMenuComponent, TranslocoModule],
})
export class OutcomeCardComponent {
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  // RBAC Permissions
  private readonly updateOutcomePermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.UPDATE.UPDATE_LEARNING_OUTCOMES;
  private readonly deleteOutcomePermissionId =
    RESOURCE_PERMISSION.LEARNING_OUTCOMES.DELETE.DELETE_LEARNING_OUTCOMES;

  @Input() outcome!: OutcomeCardData;

  @Output() editOutcome = new EventEmitter<number>();
  @Output() deleteOutcome = new EventEmitter<number>();

  get menuItems(): PopupItem[] {
    const items: PopupItem[] = [];

    // Edit outcome - requires UPDATE_LEARNING_OUTCOMES permission
    if (this.rbacService.hasPermission(this.updateOutcomePermissionId)) {
      items.push({
        id: 'edit',
        title: this.hesTranslateService.t(
          'learning_outcome.edit_outcome.title',
        ),
        icon: faEdit,
        action: () => this.onEditOutcome(),
      });
    }

    // Delete outcome - requires DELETE_LEARNING_OUTCOMES permission
    if (this.rbacService.hasPermission(this.deleteOutcomePermissionId)) {
      items.push({
        id: 'delete',
        title: this.hesTranslateService.t(
          'learning_outcome.delete_outcome.title',
        ),
        icon: faTrash,
        state: 'danger',
        action: () => this.onDeleteOutcome(),
      });
    }

    return items;
  }

  get hasMenuItems(): boolean {
    return this.menuItems.length > 0;
  }

  getEducationalPathClasses(path: string): string {
    const colors = EDUCATIONAL_PATH_COLORS[path];
    if (colors) {
      return `${colors.bg} ${colors.text}`;
    }
    // Default fallback
    return 'bg-gray-400 text-white';
  }

  getEducationalPathTranslationKey(path: string): string {
    return `enum.${path}`;
  }

  onEditOutcome() {
    this.editOutcome.emit(this.outcome.id);
  }

  onDeleteOutcome() {
    this.deleteOutcome.emit(this.outcome.id);
  }
}
