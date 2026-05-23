import { Component, inject, input } from '@angular/core';
import { HesToasterService } from '@shared/services/hes-toaster.service';

/**
 * Sample content component demonstrating how to use DsModalService.
 * This component receives closeModal function automatically from the service.
 */
@Component({
  selector: 'app-modal-sample-content',
  standalone: true,
  template: `
    <div class="flex flex-col gap-4">
      <p class="text-emphasis-high">
        This is a sample modal content that demonstrates the reusable modal
        component structure. The same content is used across different modal
        variations to showcase header and footer configurations.
      </p>

      <div class="bg-bg-surface-secondary rounded-ds-md p-4">
        <h4 class="heading-h4-high-emphasis mb-2">Sample Section</h4>
        <p class="text-emphasis-mid">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>

      <div class="flex gap-3">
        <div
          class="flex-1 rounded-ds-md border border-stroke-cool-black-04 p-3"
        >
          <span class="heading-h5-high-emphasis">Item 1</span>
          <p class="text-sm text-emphasis-mid">Description text</p>
        </div>
        <div
          class="flex-1 rounded-ds-md border border-stroke-cool-black-04 p-3"
        >
          <span class="heading-h5-high-emphasis">Item 2</span>
          <p class="text-sm text-emphasis-mid">Description text</p>
        </div>
      </div>
    </div>
  `,
})
export class ModalSampleContentComponent {
  private toast = inject(HesToasterService);

  /** Injected by DsModalService - function to close the modal */
  closeModal!: (data?: unknown, role?: string) => void;

  /** Optional custom message passed via componentProps */
  readonly message = input<string>();

  /**
   * Called by modal footer primary button click.
   * The wrapper component checks for this method and calls it if exists.
   */
  onPrimaryClick(): void {
    this.toast.success('Primary action executed!', 'Success');
    this.closeModal({ action: 'primary' }, 'confirm');
  }

  /**
   * Called by modal footer secondary button click.
   * The wrapper component checks for this method and calls it if exists.
   */
  onSecondaryClick(): void {
    this.toast.info('Secondary action executed', 'Info');
    this.closeModal({ action: 'secondary' }, 'cancel');
  }
}
