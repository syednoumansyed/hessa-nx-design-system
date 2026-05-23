import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { IJournalListItem } from '@pages/journal/data-access/journal-list.utils';
import { JournalStatus } from '@pages/journal/data-access/journal.enum';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-status-table-cell',
  templateUrl: './status-table-cell.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class StatusTableCellComponent implements ICellRendererAngularComp {
  private readonly translateService = inject(HesTranslateService);
  private readonly auth = inject(AuthService);
  status: JournalStatus | VIEW;
  agInit(params: ICellRendererParams<IJournalListItem, any, any>): void {
    const { data } = params;
    if (data) {
      this.status =
        this.auth.isUserPersonnel() && data.viewedByGuardian
          ? VIEW.VIEWED
          : data.status;
    }
  }
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  get statusName() {
    return this.translateService.enumT(this.status);
  }

  get isViewed() {
    return this.status === VIEW.VIEWED;
  }

  get isNew() {
    return this.status === JournalStatus.NEW;
  }

  get isDraft() {
    return this.status === JournalStatus.DRAFT;
  }

  get isPublished() {
    return this.status === JournalStatus.PUBLISHED;
  }

  get isAckknowledged() {
    return this.status === JournalStatus.ACKNOWLEDGED;
  }
}

enum VIEW {
  VIEWED = 'VIEWED',
}
