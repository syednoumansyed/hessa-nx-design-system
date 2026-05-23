import { Component, computed } from '@angular/core';
import { CdkStepper, CdkStepperModule } from '@angular/cdk/stepper';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChevronUp,
  faChevronDown,
  faCheck,
} from '@fortawesome/pro-regular-svg-icons';
import { isMobile } from '@shared/utils/platform';

@Component({
  selector: 'app-hes-stepper',
  templateUrl: './hes-stepper.component.html',
  styleUrls: ['./hes-stepper.component.scss'],
  standalone: true,
  imports: [NgTemplateOutlet, CdkStepperModule, NgClass, FontAwesomeModule],
  providers: [{ provide: CdkStepper, useExisting: HesStepperComponent }],
})
export class HesStepperComponent extends CdkStepper {
  faChevronUp = faChevronUp;
  faChevronDown = faChevronDown;
  faCheck = faCheck;
  isMobile = isMobile();

  isVertical = computed(() => this.orientation === 'vertical');
}
