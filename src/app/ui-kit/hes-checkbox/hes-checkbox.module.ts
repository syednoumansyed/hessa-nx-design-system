import { NgModule } from '@angular/core';
import { HesCheckboxDirective } from './hes-checkbox.directive';
import { IonCheckbox } from '@ionic/angular/standalone';
import { HesCheckboxGroupComponent } from './hes-checkbox-group.component';

@NgModule({
  declarations: [],
  imports: [HesCheckboxDirective, IonCheckbox, HesCheckboxGroupComponent],
  exports: [HesCheckboxDirective, IonCheckbox, HesCheckboxGroupComponent],
})
export class HesCheckboxModule {}
