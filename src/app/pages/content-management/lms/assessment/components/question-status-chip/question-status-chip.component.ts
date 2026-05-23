import { Component, input, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faCheck,
  faCircleExclamation,
  faListUl,
} from '@fortawesome/pro-solid-svg-icons';
import { DS_TRANSLATION_TOKEN } from '@ds/i18n/ds-translation.token';

export type QuestionStatus =
  | 'current'
  | 'attempted'
  | 'not-visited'
  | 'visited'
  | 'all';

@Component({
  selector: 'app-question-status-chip',
  standalone: true,
  templateUrl: './question-status-chip.component.html',
  imports: [NgClass, DsIconComponent],
})
export class QuestionStatusChipComponent {
  value = input<string | number>('');
  status = input<QuestionStatus>('all');
  private readonly translationService = inject(DS_TRANSLATION_TOKEN);

  display = computed(() => {
    switch (this.status()) {
      case 'attempted':
        return {
          icon: faCheck,
          text: null,
        };
      case 'all':
        return {
          icon: faListUl,
          text: this.translationService.translate('global.all.txt'),
        };
      default:
        return {
          icon: null,
          text: this.value()?.toString(),
        };
    }
  });

  sideIcon = computed(() => {
    switch (this.status()) {
      case 'visited':
        return {
          icon: faCircleExclamation,
          cssClass: 'text-icon-error',
        };
      default:
        return null;
    }
  });

  getTypeWiseClass = computed<string>(() => {
    switch (this.status()) {
      case 'not-visited':
        return 'border-stroke-low bg-surface-primary text-content-low';
      case 'current':
        return 'bg-surface-action border-surface-action rounded-full text-content-high';
      case 'visited':
        return 'bg-surface-orange-subtle border-stroke-color-orange-subtle-light';
      case 'attempted':
        return 'bg-stroke-color-orange-subtle-light';
      case 'all':
        return 'border-stroke-high text-content-high';
      default:
        return '';
    }
  });

  statusClass = computed(() => {
    const defaultClass =
      'min-w-[44px] min-h-[32px] rounded-ds-md border-2 flex justify-center items-center single-line-md-high-emphasis cursor-pointer relative p-ds-sm gap-ds-xs';
    return [defaultClass, this.getTypeWiseClass()].filter(Boolean).join(' ');
  });
}
