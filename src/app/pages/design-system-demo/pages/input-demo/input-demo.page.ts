import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { faMessage } from '@fortawesome/pro-regular-svg-icons';
import { DsInputComponent } from '@ds/input/input.component';
import { DsTextareaComponent } from 'src/app/design-system/text-area/text-area.component';
import { SearchBoxComponent } from '@ds/search-box/search-box.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';

@Component({
  selector: 'app-input-demo',
  standalone: true,
  imports: [
    IonContent,
    ReactiveFormsModule,
    DsInputComponent,
    DsTextareaComponent,
    SearchBoxComponent,
    DemoPageWrapperComponent,
  ],
  templateUrl: './input-demo.page.html',
})
export class InputDemoPage {
  private toast = inject(HesToasterService);

  messageIcon = faMessage;
  ctrl = new FormControl();
  emailCtrl = new FormControl('', [Validators.required, Validators.email]);
  disabledCtrl = new FormControl({ value: 'eng@gmail.com', disabled: true });
  loadingCtrl = new FormControl('here you can see loading');
  textAreaCtrl = new FormControl('', [
    Validators.required,
    Validators.maxLength(180),
  ]);
  searchBoxValue = signal('');

  onSearchChange(value: string) {
    this.searchBoxValue.set(value);
    this.toast.info(`Search: "${value}"`, 'Search Changed');
  }

  onSearchAddClick() {
    this.toast.success('Add button clicked!', 'Search Box');
  }

  onSearchCancelClick() {
    this.toast.info('Cancel button clicked!', 'Search Box');
  }
}
