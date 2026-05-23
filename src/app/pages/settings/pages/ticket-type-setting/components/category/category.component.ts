import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { isMobile } from '@shared/utils/platform';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ObjId } from '@shared/interfaces/common.interface';
import { TicketTypeService } from '@shared/services/ticket-type.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { CommonModule } from '@angular/common';
import { HesActionSheetComponent } from '@ui-kit/hes-action-sheet/hes-action-sheet.component';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';
import { TranslocoDirective } from '@jsverse/transloco';
import { SupportType } from '@shared/dto-transformation';
import { createManageCategoryDialog } from '../manage-category-dialog';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  standalone: true,
  imports: [
    RouterModule,
    HesButtonModule,
    CommonModule,
    HesActionSheetComponent,
    EnumLangPipe,
    TranslocoDirective,
  ],
})
export class CategoryComponent {
  // #region Inputs & Outputs
  category = input<SupportType>();
  onRefresh = output<void>();
  // #endregion

  //#region Injectables
  private readonly ticketTypeService = inject(TicketTypeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly feedbackService = inject(FeedbackService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly hesToaster = inject(HesToasterService);
  private readonly openManageCategoryDialog = createManageCategoryDialog();
  //#endregion

  //#region Protected Properties
  protected readonly isMobile = isMobile();
  protected isLoading = signal(false);

  protected actions = computed<IAction<{ id: ObjId }>[]>(() => {
    const cat = this.category();
    if (cat == null) {
      return [];
    }
    return [
      {
        text: this.hesTranslateService.t('global.view.btn'),
        onClick: () => {
          this.router.navigate([cat.id], {
            relativeTo: this.route,
          });
        },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.supportTicket.viewCategoryDetails,
          );
        },
      },
      {
        text: this.hesTranslateService.t('global.edit.btn'),
        onClick: () => {
          this.onEditCategory(cat.id);
        },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.supportTicket.updateCategory,
          );
        },
      },
      {
        text: this.hesTranslateService.t('global.delete.btn'),
        onClick: () => {
          this.feedbackService.openFeedbackModal(
            {
              type: 'error',
              modalTitle: this.hesTranslateService.t(
                'content_management.main_content.delete_category_confirmation',
              ),
              primaryBtnStr: this.hesTranslateService.t('global.delete.btn'),
              secondaryBtnStr: this.hesTranslateService.t('global.cancel.btn'),
            },
            () => {
              this.deleteCategory(cat.id);
            },
          );
        },
        hasPermission: () => {
          if ((cat.categoryCount ?? 0) > 0) {
            return false;
          }
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.supportTicket.deleteCategory,
          );
        },
      },
    ].filter((action) => {
      return action.hasPermission();
    });
  });
  //#endregion

  //#region Private Methods
  private onEditCategory(categoryId: ObjId): void {
    this.openManageCategoryDialog({
      categoryId,
      refreshCategories: () => this.onRefresh.emit(),
    });
  }

  private deleteCategory(id: ObjId) {
    this.isLoading.set(true);
    this.ticketTypeService.deleteCategory(id).subscribe({
      next: () => {
        this.hesToaster.success(
          this.hesTranslateService.t(
            `support_tickets.category_deleted_successfully.txt`,
          ),
        );
        this.onRefresh.emit();
      },
      error: (err) => {
        this.hesToaster.error(
          this.hesTranslateService.t(`support_tickets.deleting_category.txt`),
        );
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }
  //#endregion
}
