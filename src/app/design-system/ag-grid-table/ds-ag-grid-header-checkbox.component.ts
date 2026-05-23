import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';

@Component({
  selector: 'app-ds-ag-grid-header-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule, DsCheckboxComponent],
  template: `
    <app-ds-checkbox
      size="sm"
      [variantInput]="variant()"
      [ngModel]="checked()"
      [disabled]="disabled()"
      (ngModelChange)="onToggle($event)"
    ></app-ds-checkbox>
  `,
  host: { class: 'flex items-center justify-center h-full w-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsAgGridHeaderCheckboxComponent
  implements IHeaderAngularComp, OnDestroy
{
  checked = signal(false);
  disabled = signal(false);
  variant = signal<'determinate' | 'indeterminate'>('determinate');
  private params?: IHeaderParams;
  private selectionListener?: () => void;
  private readonly cdr = inject(ChangeDetectorRef);

  agInit(params: IHeaderParams): void {
    this.params = params;
    this.updateState();
    this.selectionListener = () => {
      this.updateState();
      this.cdr.detectChanges();
    };
    params.api.addEventListener('selectionChanged', this.selectionListener);
    params.api.addEventListener('rowDataUpdated', this.selectionListener);
  }

  refresh(params: IHeaderParams): boolean {
    this.params = params;
    this.updateState();
    return true;
  }

  onToggle(checked: boolean): void {
    if (!this.params) return;

    // When in indeterminate state, clicking should always select all
    // (the checkbox toggles checked→false, but we want select-all behavior)
    const isIndeterminate = this.variant() === 'indeterminate';
    const shouldSelectAll = checked || isIndeterminate;

    if (shouldSelectAll) {
      this.params.api.selectAll();
    } else {
      this.params.api.deselectAll();
    }

    // Notify parent table about select-all-across-pages intent
    const ctx = this.params.context as {
      onSelectAllAcrossPages?: (checked: boolean) => void;
    };
    if (ctx?.onSelectAllAcrossPages) {
      ctx.onSelectAllAcrossPages(shouldSelectAll);
    }

    // Force synchronous update so ngModel picks up the correct
    // state after selectAll/deselectAll + parent notification.
    this.updateState();
    this.cdr.detectChanges();
  }

  private updateState(): void {
    if (!this.params) return;
    // If allPagesSelected mode is active, show checked or indeterminate
    const ctx = this.params.context as {
      isAllPagesSelected?: () => boolean;
      hasExcludedIds?: () => boolean;
    };
    if (ctx?.isAllPagesSelected?.()) {
      this.checked.set(true);
      this.variant.set(
        ctx.hasExcludedIds?.() ? 'indeterminate' : 'determinate',
      );
      return;
    }
    const selectedCount = this.params.api.getSelectedNodes().length;
    let selectableCount = 0;
    this.params.api.forEachNode((node) => {
      if (node.selectable) selectableCount++;
    });
    this.disabled.set(selectableCount === 0);
    if (selectableCount === 0 || selectedCount === 0) {
      this.checked.set(false);
      this.variant.set('determinate');
      return;
    }
    if (selectedCount >= selectableCount) {
      this.checked.set(true);
      this.variant.set('determinate');
      return;
    }
    this.checked.set(true);
    this.variant.set('indeterminate');
  }

  ngOnDestroy(): void {
    if (this.params && this.selectionListener) {
      this.params.api.removeEventListener(
        'selectionChanged',
        this.selectionListener,
      );
      this.params.api.removeEventListener(
        'rowDataUpdated',
        this.selectionListener,
      );
    }
  }
}
