import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonImg } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsChipComponent } from '@ds/chip/chip.component';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

export interface NoDataBtnInterface {
  label: string;
  onAction: () => void;
  disabled?: boolean;
  iconStart?: string;
  iconEnd?: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
}

export interface NoDataFilterChip {
  label: string;
  removable?: boolean;
  onRemove?: () => void;
}

@Component({
  selector: 'app-no-data-card',
  templateUrl: './no-data-card.component.html',
  standalone: true,
  host: { class: 'block w-full' },
  imports: [
    IonImg,
    HesButtonModule,
    CommonModule,
    DsButtonComponent,
    DsChipComponent,
    DsTranslatePipe,
  ],
})
export class NoDataCardComponent {
  @Input() noBgStyle: boolean = false;
  @Input() mainImagePath: string;
  @Input() title: string;
  @Input() description?: string;
  @Input() primaryButton: NoDataBtnInterface | undefined;
  @Input() secondaryButton: NoDataBtnInterface | undefined = undefined;
  @Input() filteredBy: ReadonlyArray<NoDataFilterChip> = [];
  @Input() filteredByLabel: string = 'support.hub.filter.label';
  @Input() clearFiltersButton: NoDataBtnInterface | undefined = undefined;
}
