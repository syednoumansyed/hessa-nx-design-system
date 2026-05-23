import { NgModule } from '@angular/core';

import { IonButton } from '@ionic/angular/standalone';
import { HessaBtnDirective } from './hes-button.directive';
import { HessaButtonIconDirective } from '@ui-kit/hes-button/hes-button-icon.directive';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';

@NgModule({
  declarations: [],
  imports: [
    IonButton,
    HessaBtnDirective,
    HessaButtonIconDirective,
    FontAwesomeModule,
    HesIconComponent,
  ],
  exports: [
    IonButton,
    HessaBtnDirective,
    HessaButtonIconDirective,
    FontAwesomeModule,
    HesIconComponent,
  ],
})
export class HesButtonModule {}
