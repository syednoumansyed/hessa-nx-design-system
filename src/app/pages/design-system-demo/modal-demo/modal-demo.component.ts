import { Component, inject } from '@angular/core';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsModalService } from '@ds/modal';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { ModalSampleContentComponent } from './modal-sample-content.component';

@Component({
  selector: 'app-modal-demo',
  standalone: true,
  imports: [DsButtonComponent],
  template: `
    <div class="flex flex-col gap-4">
      <h3 class="heading-h3-high-emphasis">Modal Service Demos</h3>
      <p class="text-emphasis-mid">
        Click the buttons below to see different modal variations using the
        DsModalService.
      </p>

      <h4 class="heading-h4-mid-emphasis mt-4">Large Modal (800px)</h4>
      <div class="flex flex-wrap gap-3">
        <ds-button variant="primary" (click)="openLargeModal()">
          Large Modal
        </ds-button>

        <ds-button variant="secondary" (click)="openWithBackButton()">
          With Back & Subtitle
        </ds-button>
      </div>

      <h4 class="heading-h4-mid-emphasis mt-4">Small Modal (500px)</h4>
      <div class="flex flex-wrap gap-3">
        <ds-button variant="tertiary" (click)="openSmallModal()">
          Small Modal
        </ds-button>

        <ds-button variant="dangerStroke" (click)="openDangerModal()">
          Danger Action
        </ds-button>

        <ds-button variant="ghost" (click)="openSingleButtonModal()">
          Single Button
        </ds-button>
      </div>
    </div>
  `,
})
export class ModalDemoComponent {
  private modalService = inject(DsModalService);
  private toast = inject(HesToasterService);

  async openLargeModal(): Promise<void> {
    const modalRef = await this.modalService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Large Modal',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Save' },
        secondaryButton: { text: 'Cancel' },
      },
      size: 'lg',
    });

    const result = await modalRef.onDismiss();
    this.toast.info(`Modal closed with role: ${result.role}`, 'Modal Result');
  }

  async openWithBackButton(): Promise<void> {
    const modalRef = await this.modalService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Step 2 of 3',
        subtitle: 'Showing only your accessible classes',
        showCloseButton: true,
        showBackButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Next' },
        secondaryButton: { text: 'Previous', variant: 'tertiary' },
      },
      size: 'lg',
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'back') {
      this.toast.info('Back button clicked', 'Navigation');
    }
  }

  async openSmallModal(): Promise<void> {
    const modalRef = await this.modalService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Small Modal',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Confirm' },
        secondaryButton: { text: 'Cancel' },
      },
      size: 'sm',
    });

    const result = await modalRef.onDismiss();
    this.toast.info(`Modal closed with role: ${result.role}`, 'Modal Result');
  }

  async openDangerModal(): Promise<void> {
    const modalRef = await this.modalService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Delete Item',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Delete', variant: 'dangerFill' },
        secondaryButton: { text: 'Cancel' },
      },
      size: 'sm',
      backdropDismiss: false,
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'confirm') {
      this.toast.error('Item deleted', 'Deleted');
    }
  }

  async openSingleButtonModal(): Promise<void> {
    const modalRef = await this.modalService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'View Details',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Got it' },
      },
      size: 'sm',
    });

    await modalRef.onDismiss();
  }
}
