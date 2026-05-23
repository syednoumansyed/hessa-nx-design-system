import { Component, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { provideIcons } from '@ng-icons/core';
import {
  saxBuildings2Outline,
  saxHome2Outline,
} from '@ng-icons/iconsax/outline';
import { DsButtonComponent } from 'src/app/design-system/button/button.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';

@Component({
  selector: 'app-button-demo',
  standalone: true,
  imports: [IonContent, DsButtonComponent, DemoPageWrapperComponent],
  viewProviders: [
    provideIcons({
      saxHome2Outline,
      saxBuildings2Outline,
    }),
  ],
  templateUrl: './button-demo.page.html',
})
export class ButtonDemoPage {
  private toast = inject(HesToasterService);
  loading = signal(true);

  onClick() {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
    }, 4000);
  }

  openToast(type: 'success' | 'error' | 'info' | 'warning') {
    switch (type) {
      case 'success':
        this.toast.success('This is a success message', 'Success');
        break;
      case 'error':
        this.toast.error('This is an error message', 'Error');
        break;
      case 'info':
        this.toast.info('This is an info message', 'Info');
        break;
      case 'warning':
        this.toast.warning('This is a warning message', 'Warning');
        break;
    }
  }
}
