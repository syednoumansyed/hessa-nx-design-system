import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams, IRowNode } from 'ag-grid-community';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';

@Component({
  selector: 'app-ds-ag-grid-checkbox-cell',
  standalone: true,
  imports: [CommonModule, FormsModule, DsCheckboxComponent],
  template: `
    <app-ds-checkbox
      size="sm"
      [ngModel]="checked()"
      [disabled]="disabled()"
      (ngModelChange)="onToggle($event)"
    ></app-ds-checkbox>
  `,
  host: { class: 'flex items-center justify-center h-full w-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsAgGridCheckboxCellComponent
  implements ICellRendererAngularComp, OnDestroy
{
  checked = signal(false);
  disabled = signal(false);
  private rowNode?: IRowNode;
  private selectedListener?: () => void;

  agInit(params: ICellRendererParams): void {
    this.rowNode = params.node;
    this.checked.set(!!params.node.isSelected());
    this.disabled.set(!params.node.selectable);
    this.selectedListener = () => {
      this.checked.set(!!params.node.isSelected());
    };
    params.node.addEventListener('rowSelected', this.selectedListener);
  }

  refresh(params: ICellRendererParams): boolean {
    this.checked.set(!!params.node.isSelected());
    this.disabled.set(!params.node.selectable);
    return true;
  }

  onToggle(next: boolean): void {
    if (!this.rowNode || this.disabled()) return;
    this.rowNode.setSelected(next);
  }

  ngOnDestroy(): void {
    if (this.rowNode && this.selectedListener) {
      this.rowNode.removeEventListener('rowSelected', this.selectedListener);
    }
  }
}
