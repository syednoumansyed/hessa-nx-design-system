import { inject } from '@angular/core';
import { DsModalService } from '@ds/modal';
import { ObjId } from '@shared/interfaces/common.interface';
import { ManageCategoryDialogComponent } from './manage-category-dialog.component';

export function createManageCategoryDialog() {
  const modalService = inject(DsModalService);

  return async function ({
    categoryId,
    refreshCategories,
  }: {
    categoryId?: ObjId; // Pass for edit mode, omit for add mode
    refreshCategories: () => void;
  }) {
    const modalRef = await modalService.open({
      component: ManageCategoryDialogComponent,
      componentProps: {
        categoryId,
      },
      size: 'lg',
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'confirm') {
      refreshCategories();
    }
  };
}
