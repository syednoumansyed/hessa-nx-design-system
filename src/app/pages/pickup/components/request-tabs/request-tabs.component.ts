import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { PickupRequestStatus } from '@shared/enums';
import { PickupTab } from '@shared/dto-transformation/pick-up/pickup.interface';
import { HesCheckboxModule } from '@ui-kit/hes-checkbox/hes-checkbox.module';

@Component({
  selector: 'app-request-tabs',
  standalone: true,
  templateUrl: './request-tabs.component.html',
  imports: [CommonModule, HesCheckboxModule],
})
export class RequestTabsComponent implements OnInit {
  @Input() activeTab: string = PickupRequestStatus.ALL;
  @Output() tabChange = new EventEmitter<PickupRequestStatus>();
  @Input() tabsData: PickupTab[] = [];

  currentLang: string = '';
  translocoService = inject(TranslocoService);

  ngOnInit() {
    this.currentLang = this.translocoService.getActiveLang();
  }
  onTabChange(tabId: PickupRequestStatus) {
    this.activeTab = tabId;
    this.tabChange.emit(tabId);
  }
}
