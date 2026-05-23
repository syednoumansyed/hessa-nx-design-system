import { NgModule } from '@angular/core';
import { HesRadioDirective } from './hes-radio.directive';
import { IonRadio, IonRadioGroup } from '@ionic/angular/standalone';

@NgModule({
  declarations: [],
  imports: [HesRadioDirective, IonRadio, IonRadioGroup],
  exports: [HesRadioDirective, IonRadio, IonRadioGroup],
})
export class HesRadioModule {}
