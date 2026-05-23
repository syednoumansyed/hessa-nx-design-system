import { Injectable } from '@angular/core';
import { HelpCenterDocumentListItem } from '@pages/help-center/data-access/documentation.interface';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserManualListControllerService {
  private activeListItemSource = new BehaviorSubject<ActiveListItem | null>(
    null,
  );
  public activeListItem$ = this.activeListItemSource.asObservable();
  constructor() {}
  setActiveListItem(activeListItem: ActiveListItem | null) {
    this.activeListItemSource.next(activeListItem);
  }
  get activeListItem() {
    return this.activeListItemSource.value;
  }
}

export interface ActiveListItem {
  typeId: number;
  articleId: number | null;
  data?: HelpCenterDocumentListItem;
}
