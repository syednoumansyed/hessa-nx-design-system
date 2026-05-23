import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HesActionSheetComponent } from '@ui-kit/hes-action-sheet/hes-action-sheet.component';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { IGuardianListItem, IStudentListItem } from '@shared/interfaces';

type ICustomCellParams = ICellRendererParams & {
  actions: IAction[];
  forceActionSheet?: boolean;
};

@Component({
  selector: 'app-custom-actions-cell',
  standalone: true,
  imports: [HesActionSheetComponent],
  template: `
    <app-hes-action-sheet
      [data]="rowData()"
      [actions]="actions()"
      [forceActionSheet]="forceActionSheet"
    ></app-hes-action-sheet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomActionsCellComponent implements ICellRendererAngularComp {
  params = signal<ICustomCellParams | undefined>(undefined);
  actions = signal<IAction[]>([]);
  rowData = signal<IGuardianListItem | IStudentListItem | undefined>(undefined);
  forceActionSheet = false;
  agInit(params: ICustomCellParams): void {
    this.params.set(params);
    this.rowData.set(params.data);
    this.actions.set(params.actions);
    this.forceActionSheet = params.forceActionSheet ?? false;
  }

  refresh(_params: ICustomCellParams): boolean {
    return false;
  }

  constructor() {}
}
