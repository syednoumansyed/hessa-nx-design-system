import { Component } from '@angular/core';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams, IDoesFilterPassParams } from 'ag-grid-community';

@Component({
  template: ``,
})
export class CustomFilterComponent implements IFilterAngularComp {
  params: IFilterParams;

  agInit(params: IFilterParams): void {
    this.params = params;
  }

  isFilterActive(): boolean {
    // return true if the filter is active
    return false;
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    // return true if the value passes the filter
    return true;
  }

  getModel(): any {
    // return the current model (used when saving)
    return null;
  }

  setModel(model: any): void {
    // set the model (used when restoring or setting an initial value)
  }
}
