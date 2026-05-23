import { inject } from '@angular/core';
import { DsModalService } from '@ds/modal';
import { AddEditSubCategoryDialogComponent } from './add-edit-sub-category-dialog.component';
import { SubCategoryDetail, SupportType } from '@shared/dto-transformation';
import { HesTranslateService } from '@shared/services/hes-translate.service';

export function createSubCategoryDialog() {
  const modalService = inject(DsModalService);
  const hesTranslateService = inject(HesTranslateService);

  return async function ({
    isEdit,
    category,
    subCategory,
    refreshCategories,
  }: {
    isEdit?: boolean;
    category: SupportType;
    subCategory?: SubCategoryDetail;
    refreshCategories?: () => void;
  }) {
    const modalRef = await modalService.open({
      component: AddEditSubCategoryDialogComponent,
      componentProps: {
        isEdit: isEdit ?? false,
        category,
        subCategory,
      },
      headerConfig: {
        title: hesTranslateService.t(
          isEdit
            ? 'support_tickets.edit_sub_category.title'
            : 'support_tickets.add_sub_category.title',
        ),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: hesTranslateService.t('global.save.btn') },
        secondaryButton: { text: hesTranslateService.t('global.cancel.btn') },
        buttonSize: 'lg',
      },
      size: 'lg',
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'confirm') {
      refreshCategories?.();
    }
  };
}
