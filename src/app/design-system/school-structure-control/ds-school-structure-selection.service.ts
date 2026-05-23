import { inject, Injectable } from '@angular/core';
import { DsModalService } from '@ds/modal';
import type { DsModalRef, DsModalResult } from '@ds/modal';
import { StructureDepth } from '@shared/utils/school-structure';
import {
  DsSchoolStructureControlItem,
  DsSchoolStructureControlValue,
  DsSchoolStructureEntityType,
} from './types/school-structure-control.types';
import { DsSchoolStructureSelectionModalComponent } from './ds-school-structure-selection-modal.component';

export interface DsSchoolStructureSelectionConfig {
  nodes?: DsSchoolStructureControlItem[] | null;
  initialSelection?: DsSchoolStructureControlValue[] | null;
  isMultiSelect?: boolean;
  depth?: StructureDepth;
  allowedSelections?: DsSchoolStructureEntityType[] | null;
  searchTypes?: DsSchoolStructureEntityType[] | null;
  title?: string | null;
  confirmLabel?: string | null;
  cancelLabel?: string | null;
  searchPlaceholder?: string | null;
  showSearch?: boolean;
  requireSelection?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  showCancelButton?: boolean;
  allowCancelWhenRequired?: boolean;
  backdropDismiss?: boolean;
  mobileHandle?: boolean;
  mobileBreakpoint?: number;
  mobileBreakpoints?: number[];
}

@Injectable({ providedIn: 'root' })
export class DsSchoolStructureSelectionService {
  private readonly modalService = inject(DsModalService);
  private activeModalRef: DsModalRef<DsSchoolStructureControlValue[]> | null =
    null;
  private opening = false;

  async open(
    config: DsSchoolStructureSelectionConfig,
  ): Promise<DsModalResult<DsSchoolStructureControlValue[]>> {
    if (this.opening) {
      return { role: 'close' };
    }

    this.opening = true;
    try {
      if (this.activeModalRef) {
        await this.activeModalRef.onDismiss();
        this.activeModalRef = null;
      }

      const requireSelection = config.requireSelection ?? false;

      const modalRef = await this.modalService.open<
        {
          nodes?: DsSchoolStructureControlItem[] | null;
          initialSelection?: DsSchoolStructureControlValue[] | null;
          isMultiSelect?: boolean;
          depth?: StructureDepth;
          allowedSelections?: DsSchoolStructureEntityType[] | null;
          searchTypes?: DsSchoolStructureEntityType[] | null;
          title?: string | null;
          confirmLabel?: string | null;
          cancelLabel?: string | null;
          searchPlaceholder?: string | null;
          showSearch?: boolean;
          requireSelection?: boolean;
          showHeader?: boolean;
          showFooter?: boolean;
          showCancelButton?: boolean;
          allowCancelWhenRequired?: boolean;
        },
        DsSchoolStructureControlValue[]
      >({
        component: DsSchoolStructureSelectionModalComponent,
        componentProps: {
          nodes: config.nodes ?? null,
          initialSelection: config.initialSelection ?? null,
          isMultiSelect: config.isMultiSelect ?? false,
          depth: config.depth ?? StructureDepth.CLASS,
          allowedSelections: config.allowedSelections ?? null,
          searchTypes: config.searchTypes ?? null,
          title: config.title ?? null,
          confirmLabel: config.confirmLabel ?? null,
          cancelLabel: config.cancelLabel ?? null,
          searchPlaceholder: config.searchPlaceholder ?? null,
          showSearch: config.showSearch ?? true,
          requireSelection,
          showHeader: config.showHeader ?? true,
          showFooter: config.showFooter ?? true,
          showCancelButton: config.showCancelButton ?? true,
          allowCancelWhenRequired: config.allowCancelWhenRequired ?? false,
        },
        size: 'lg',
        mobileHandle: config.mobileHandle ?? !requireSelection,
        mobileBreakpoint: config.mobileBreakpoint,
        mobileBreakpoints: config.mobileBreakpoints,
        contentClass: 'p-ds-xl',
        respectTopSafeArea: true,
        backdropDismiss: config.backdropDismiss ?? true,
      });

      this.activeModalRef = modalRef;
      const result = await modalRef.onDismiss();
      this.activeModalRef = null;
      return result;
    } finally {
      this.opening = false;
    }
  }
}
