import { Component, Input, OnInit, computed, inject } from '@angular/core';
import { SchoolStructureControlHelperService } from '../school-structure-control.helper.service';
import { SchoolStructureControlItem } from '../school-structure-control-item.interface';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { FaIconComponentsProps } from '@shared/types';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { ModalController } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-view-all-select-value',
  templateUrl: './view-all-select-value.component.html',
  standalone: true,
  imports: [HesButtonModule, HesIconComponent, TranslocoDirective],
})
export class ViewAllSelectValueComponent implements OnInit {
  readonly modalControl = inject(ModalController);
  @Input()
  schoolStructureControlHelperService: SchoolStructureControlHelperService;
  readonly selectedValue = computed(() => {
    return this.schoolStructureControlHelperService.mapSelectValue();
  });
  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'sm',
  };
  constructor() {}

  ngOnInit() {}

  onDeselect(item: SchoolStructureControlItem) {
    this.schoolStructureControlHelperService.onDeselect(item);
  }

  onClose() {
    this.modalControl.dismiss();
  }
}
