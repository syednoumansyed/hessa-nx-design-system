import { Component, input, OnInit, signal } from '@angular/core';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';
import {
  DsProgressBarComponent,
  ProgressBarVariant,
} from '@ds/progress-bar/progress-bar.component';
import { DsChipComponent } from '@ds/chip/chip.component';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

export enum WorkOverviewItemType {
  VIDEO = 'VIDEO',
  ATTACHMENT = 'ATTACHMENT',
  ASSIGNMENT = 'ASSIGNMENT',
  EXAM = 'EXAM',
}

export interface WorkOverviewItemConfig {
  type: WorkOverviewItemType;
  title: string;
  icon: DsIcon;
  iconColor: string;
  supportText: string;
  chip: {
    text: string;
  };
  progressBar: {
    value: number;
    variant?: ProgressBarVariant;
  };
}

@Component({
  selector: 'app-work-overview-item',
  templateUrl: './work-overview-item.component.html',
  imports: [
    DsIconComponent,
    DsProgressBarComponent,
    DsChipComponent,
    DsTranslatePipe,
  ],
  standalone: true,
})
export class WorkOverviewItemComponent implements OnInit {
  config = input.required<WorkOverviewItemConfig>();
  constructor() {}

  ngOnInit() {}
}
