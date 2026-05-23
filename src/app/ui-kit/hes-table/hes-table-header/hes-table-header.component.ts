import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';

export interface ICustomHeaderParams {
  menuIcon: string;
}

@Component({
  selector: 'app-hes-table-header',
  templateUrl: './hes-table-header.component.html',
  styleUrls: ['./hes-table-header.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class HesTableHeaderComponent implements IHeaderAngularComp {
  public params!: IHeaderParams & ICustomHeaderParams;

  public ascSort = 'inactive';
  public descSort = 'inactive';
  public noSort = 'inactive';

  @ViewChild('menuButton', { read: ElementRef }) public menuButton!: ElementRef;

  agInit(params: IHeaderParams & ICustomHeaderParams): void {
    this.params = params;

    params.column.addEventListener(
      'sortChanged',
      this.onSortChanged.bind(this),
    );

    this.onSortChanged();
  }

  onMenuClicked() {
    this.params.showColumnMenu(this.menuButton.nativeElement);
  }

  onSortChanged() {
    this.ascSort = this.descSort = this.noSort = 'inactive';
    if (this.params.column.isSortAscending()) {
      this.ascSort = 'active';
    } else if (this.params.column.isSortDescending()) {
      this.descSort = 'active';
    } else {
      this.noSort = 'active';
    }
  }

  onSortRequested(order: 'asc' | 'desc' | null, event: any) {
    this.params.setSort(order, event.shiftKey);
  }

  refresh(params: IHeaderParams) {
    return false;
  }
}
