import { NgTemplateOutlet } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FaIconComponentsProps, hesIcon } from '../../types';
import { isMobile } from '@shared/utils/platform';
import { HesIconComponent } from '../hes-icon/hes-icon.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';

interface CardListIcon {
  faIcon?: FaIconComponentsProps;
  hesIcon?: hesIcon;
}

interface CartListAction<T = any> {
  label: string;
  onAction: (data?: T) => void;
  permissionId?: number;
  hasAccess: boolean;
}

export interface CardListItemConfig<T = any> {
  title: string;
  icon: CardListIcon;
  data?: T;
  info: Array<CardListIcon & { label: string }>;
  actions?: Array<CartListAction<T>>;
}

@Component({
  selector: 'app-card-list-item',
  templateUrl: './card-list-item.component.html',
  standalone: true,
  imports: [HesButtonModule, HesIconComponent, RbacDirective, NgTemplateOutlet],
})
export class CardListItemComponent {
  cardHesIconClass = 'text-[2rem] md:text-[3rem] text-primary-400';
  infoHesIconClass = 'text-base';

  isMobile = isMobile();

  private _config: CardListItemConfig;
  @Input() set config(val: CardListItemConfig) {
    let mappedIcon = { ...val.icon };
    if (mappedIcon.hesIcon) {
      mappedIcon.hesIcon.class =
        this.cardHesIconClass + ' ' + val.icon.hesIcon?.class;
    }
    if (mappedIcon.faIcon) {
      mappedIcon.faIcon.size = isMobile() ? '3x' : 'xl';
    }

    let mappedInfo = [...val.info];
    mappedInfo = mappedInfo.map((info) => {
      if (info.hesIcon) {
        info.hesIcon.class = this.infoHesIconClass;
      }
      return info;
    });

    const allowedActions = val.actions?.filter((a) => a.hasAccess);

    this._config = {
      ...val,
      info: mappedInfo,
      icon: mappedIcon,
      actions: allowedActions,
    };
  }
  get config() {
    return this._config;
  }
}
