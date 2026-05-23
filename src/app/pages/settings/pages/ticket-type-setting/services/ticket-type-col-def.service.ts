import { Injectable, inject, computed, signal } from '@angular/core';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ITableCol } from '@ui-kit/hes-table/model';
import { faPen, faTrashCan } from '@fortawesome/pro-regular-svg-icons';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { createSubCategoryDialog } from '../components/add-edit-sub-category-dialog/add-edit-sub-category-dialog';
import { TicketTypeService } from '@shared/services/ticket-type.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { ObjId } from '@shared/interfaces/common.interface';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { AccessLevelComponent } from '../components/access-level/access-level.component';
import { SubCategoryDetail } from '@shared/dto-transformation';

@Injectable({
  providedIn: 'root',
})
export class TicketTypeColDefService {
  //#region Injectables
  private readonly translateService = inject(HesTranslateService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly hesToaster = inject(HesToasterService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly ticketTypeService = inject(TicketTypeService);
  //#endregion

  //#region Protected Properties
  protected isLoading = signal(false);
  protected readonly actions = computed<IAction<any>[]>(() => {
    return [
      {
        iconProps: { icon: faPen },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.supportTicket.updateSubCategory,
          );
        },
        text: this.translateService.t('global.edit.btn'),
        onClick: (data) => {
          this.onEditSubCategory(data);
        },
      },
      {
        iconProps: { icon: faTrashCan },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.supportTicket.deleteSubCategory,
          );
        },
        text: this.translateService.t('global.delete.btn'),
        onClick: (data) => {
          this.feedbackService.openFeedbackModal(
            {
              type: 'error',
              modalTitle: this.translateService.t(
                'support_tickets.delete_sub_category.confirmation_prompt',
              ),
              primaryBtnStr: this.translateService.t('global.delete.btn'),
              secondaryBtnStr: this.translateService.t('global.cancel.btn'),
            },
            () => {
              this.deleteSubCategory(data.id);
            },
          );
        },
      },
    ];
  });
  //#endregion

  //#region Public Properties
  reload: () => void;
  columnsDef: ITableCol<any>[] = [
    {
      field: 'displayName',
      headerName: this.translateService.t(
        'support_ticket.main_content.sub_category_table_header',
      ),
      sortable: false,
      filter: false,
    },
    {
      field: 'createdAt',
      headerName: this.translateService.t(
        'support_ticket.create_date_time.label',
      ),
      sortable: false,
      filter: false,
      type: 'dateTime',
    },
    {
      field: 'createdBy',
      headerName: this.translateService.t('global.created_by.title'),
      sortable: false,
      filter: false,
      valueFormatter: ({ value }) => {
        return value.displayName;
      },
    },
    {
      field: 'accessLevel',
      headerName: this.translateService.t('global.status.title'),
      sortable: false,
      filter: false,
      cellRenderer: AccessLevelComponent,
    },
    {
      field: 'actions',
      headerName: this.translateService.t('global.actions.title'),
      sortable: false,
      filter: false,
      type: 'action',
      actions: this.actions(),
    },
  ];
  //#endregion

  //#region Private Properties
  private editSubCategoryModal = createSubCategoryDialog();
  //#endregion

  //#region Private Methods
  private onEditSubCategory(subCategory: SubCategoryDetail) {
    this.ticketTypeService.fetchCategory(subCategory.supportTypeId!).subscribe({
      next: (response) => {
        this.editSubCategoryModal({
          isEdit: true,
          subCategory: subCategory,
          category: response,
          refreshCategories: () => {
            this.reload?.();
          },
        });
      },
      error: () => {},
      complete: () => {},
    });
  }

  private deleteSubCategory(id: ObjId) {
    this.isLoading.set(true);
    this.ticketTypeService.deleteSubCategory(id).subscribe({
      next: () => {
        this.reload?.();
        this.hesToaster.success(
          this.translateService.t(`support_tickets.deleting_category.txt`),
        );
      },
      error: (err) => {
        this.hesToaster.showBackendError(err);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }
  // #endregion
}
