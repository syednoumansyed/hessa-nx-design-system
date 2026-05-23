import { Component, inject } from '@angular/core';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsSidebarService } from '@ds/sidebar';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { ModalSampleContentComponent } from '../modal-demo/modal-sample-content.component';
import { DemoFormContentComponent } from './demo-form-content.component';
import {
  DemoLongContentComponent,
  DemoTinyContentComponent,
} from './demo-long-content.component';

@Component({
  selector: 'app-sidebar-demo',
  standalone: true,
  imports: [DsButtonComponent],
  template: `
    <div class="flex flex-col gap-8">
      <div>
        <h3 class="heading-h3-high-emphasis">Sidebar Service</h3>
        <p class="mt-1 text-emphasis-mid">
          One API &mdash; <code>sidebarService.open()</code> &mdash; three
          presentations. Desktop opens a sidebar, mobile adapts to a bottom
          sheet or stacking modal sheet.
        </p>
      </div>

      <!-- ── 1. Presentation Modes ────────────────────────── -->
      <section class="flex flex-col gap-3">
        <div>
          <h4 class="heading-h4-high-emphasis">Presentation Modes</h4>
          <p class="mt-1 text-sm text-emphasis-mid">
            Default opens as bottom sheet on mobile. Set
            <code>mobilePresentation: 'modal-sheet'</code> for the stacking
            page-sheet variant.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <ds-button variant="primary" (click)="openBasic()">
            Bottom Sheet (default)
          </ds-button>
          <ds-button variant="secondary" (click)="openModalSheet()">
            Modal Sheet
          </ds-button>
        </div>
      </section>

      <!-- ── 2. Header Configurations ─────────────────────── -->
      <section class="flex flex-col gap-3">
        <div>
          <h4 class="heading-h4-high-emphasis">Header</h4>
          <p class="mt-1 text-sm text-emphasis-mid">
            Configure title, subtitle, back button, and close button. When
            <code>mobileHandle</code> is on, close button hides by default (the
            handlebar signals drag-to-close).
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <ds-button variant="primary" (click)="openHeaderTitleClose()">
            Title + Close
          </ds-button>
          <ds-button variant="secondary" (click)="openHeaderSubtitle()">
            Title + Subtitle
          </ds-button>
          <ds-button variant="secondary" (click)="openHeaderBackClose()">
            Back + Close
          </ds-button>
          <ds-button variant="tertiary" (click)="openHeaderHandlebar()">
            Handlebar (no close)
          </ds-button>
        </div>
      </section>

      <!-- ── 3. Footer Configurations ─────────────────────── -->
      <section class="flex flex-col gap-3">
        <div>
          <h4 class="heading-h4-high-emphasis">Footer Buttons</h4>
          <p class="mt-1 text-sm text-emphasis-mid">
            Buttons are always full-width in sidebar and mobile bottom sheet.
            Supports single, dual, stacked, danger variants, or no footer.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <ds-button variant="primary" (click)="openFooterTwoButtons()">
            Two Buttons
          </ds-button>
          <ds-button variant="secondary" (click)="openFooterSingleButton()">
            Single Button
          </ds-button>
          <ds-button variant="dangerStroke" (click)="openFooterDanger()">
            Danger Action
          </ds-button>
          <ds-button variant="tertiary" (click)="openFooterStacked()">
            Stacked Buttons
          </ds-button>
          <ds-button variant="ghost" (click)="openFooterNone()">
            No Footer
          </ds-button>
        </div>
      </section>

      <!-- ── 4. Content & Scrolling ───────────────────────── -->
      <section class="flex flex-col gap-3">
        <div>
          <h4 class="heading-h4-high-emphasis">Content &amp; Scrolling</h4>
          <p class="mt-1 text-sm text-emphasis-mid">
            Long content scrolls inside the sheet with pinned header and footer.
            Short content fills naturally.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <ds-button variant="primary" (click)="openLongBottom()">
            Long &mdash; Bottom Sheet
          </ds-button>
          <ds-button variant="secondary" (click)="openLongModal()">
            Long &mdash; Modal Sheet
          </ds-button>
          <ds-button variant="tertiary" (click)="openShortBottom()">
            Short &mdash; Bottom Sheet
          </ds-button>
          <ds-button variant="tertiary" (click)="openShortModal()">
            Short &mdash; Modal Sheet
          </ds-button>
        </div>
      </section>

      <!-- ── 5. Stacking & Navigation ─────────────────────── -->
      <section class="flex flex-col gap-3">
        <div>
          <h4 class="heading-h4-high-emphasis">Stacking &amp; Navigation</h4>
          <p class="mt-1 text-sm text-emphasis-mid">
            Multiple layers stack on desktop (sidebars) and mobile (modal
            sheets). Back pops one layer; close can dismiss all or current only
            via <code>closeBehavior</code>.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <ds-button variant="primary" (click)="openStacked2()">
            Stacked (2 layers)
          </ds-button>
          <ds-button variant="secondary" (click)="openStackedForm()">
            Stacked Form Flow
          </ds-button>
          <ds-button variant="tertiary" (click)="openDismissAll()">
            Close Dismisses All
          </ds-button>
          <ds-button variant="tertiary" (click)="openDismissCurrent()">
            Close Dismisses Current
          </ds-button>
        </div>
      </section>

      <!-- ── 6. Dismiss Behavior ──────────────────────────── -->
      <section class="flex flex-col gap-3">
        <div>
          <h4 class="heading-h4-high-emphasis">Dismiss Behavior</h4>
          <p class="mt-1 text-sm text-emphasis-mid">
            Default: close button + backdrop tap + drag header (mobile).
            <code>backdropDismiss: false</code> forces button-only close.
            <code>mobileHandle: true</code> shows a drag bar and hides the close
            button.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <ds-button variant="primary" (click)="openDismissDefault()">
            Default (all methods)
          </ds-button>
          <ds-button variant="secondary" (click)="openDismissNoBackdrop()">
            No Backdrop Dismiss
          </ds-button>
          <ds-button variant="tertiary" (click)="openDismissHandlebar()">
            Handlebar Only
          </ds-button>
        </div>
      </section>
    </div>
  `,
})
export class SidebarDemoComponent {
  private sidebarService = inject(DsSidebarService);
  private toast = inject(HesToasterService);

  // ─── 1. Presentation Modes ────────────────────────────

  async openBasic(): Promise<void> {
    const ref = await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Bottom Sheet',
        subtitle: 'Default mobile presentation',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Save' },
        secondaryButton: { text: 'Cancel' },
      },
    });
    const r = await ref.onDismiss();
    this.toast.info(`Closed: ${r.role}`, 'Bottom Sheet');
  }

  async openModalSheet(): Promise<void> {
    const ref = await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Modal Sheet',
        subtitle: 'Stacking page-sheet on mobile',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Continue' },
        secondaryButton: { text: 'Cancel' },
      },
      mobilePresentation: 'modal-sheet',
    });
    const r = await ref.onDismiss();
    this.toast.info(`Closed: ${r.role}`, 'Modal Sheet');
  }

  // ─── 2. Header Configurations ─────────────────────────

  async openHeaderTitleClose(): Promise<void> {
    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: { title: 'Title + Close', showCloseButton: true },
      footerConfig: { primaryButton: { text: 'Done' } },
    });
  }

  async openHeaderSubtitle(): Promise<void> {
    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Main Title',
        subtitle: 'Supporting subtitle text',
        showCloseButton: true,
      },
      footerConfig: { primaryButton: { text: 'Done' } },
    });
  }

  async openHeaderBackClose(): Promise<void> {
    const ref = await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Step 2 of 3',
        subtitle: 'Additional details',
        showCloseButton: true,
        showBackButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Next' },
        secondaryButton: { text: 'Previous', variant: 'tertiary' },
      },
    });
    const r = await ref.onDismiss();
    if (r.role === 'back') this.toast.info('Back pressed', 'Navigation');
  }

  async openHeaderHandlebar(): Promise<void> {
    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Handlebar Header',
        subtitle: 'No close button — drag to dismiss',
      },
      footerConfig: { primaryButton: { text: 'Done' } },
      mobileHandle: true,
    });
  }

  // ─── 3. Footer Configurations ─────────────────────────

  async openFooterTwoButtons(): Promise<void> {
    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: { title: 'Two Buttons', showCloseButton: true },
      footerConfig: {
        primaryButton: { text: 'Save' },
        secondaryButton: { text: 'Cancel' },
      },
    });
  }

  async openFooterSingleButton(): Promise<void> {
    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: { title: 'Single Button', showCloseButton: true },
      footerConfig: {
        primaryButton: { text: 'Got it' },
      },
    });
  }

  async openFooterDanger(): Promise<void> {
    const ref = await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: { title: 'Confirm Delete', showCloseButton: true },
      footerConfig: {
        primaryButton: { text: 'Delete', variant: 'dangerFill' },
        secondaryButton: { text: 'Cancel' },
      },
    });
    const r = await ref.onDismiss();
    if (r.role === 'confirm') this.toast.error('Deleted', 'Danger');
  }

  async openFooterStacked(): Promise<void> {
    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: { title: 'Stacked Buttons', showCloseButton: true },
      footerConfig: {
        primaryButton: { text: 'Accept & Continue' },
        secondaryButton: { text: 'Maybe Later', variant: 'ghost' },
        stackButtons: true,
      },
    });
  }

  async openFooterNone(): Promise<void> {
    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: { title: 'No Footer', showCloseButton: true },
    });
  }

  // ─── 4. Content & Scrolling ───────────────────────────

  async openLongBottom(): Promise<void> {
    await this.sidebarService.open({
      component: DemoLongContentComponent,
      headerConfig: {
        title: 'Long Content',
        subtitle: 'Scroll inside, header & footer pinned',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Done' },
        secondaryButton: { text: 'Cancel' },
      },
    });
  }

  async openLongModal(): Promise<void> {
    await this.sidebarService.open({
      component: DemoLongContentComponent,
      headerConfig: {
        title: 'Long Content',
        subtitle: 'Modal sheet variant',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Done' },
        secondaryButton: { text: 'Cancel' },
      },
      mobilePresentation: 'modal-sheet',
    });
  }

  async openShortBottom(): Promise<void> {
    await this.sidebarService.open({
      component: DemoTinyContentComponent,
      headerConfig: { title: 'Short Content', showCloseButton: true },
      footerConfig: { primaryButton: { text: 'Got it' } },
    });
  }

  async openShortModal(): Promise<void> {
    await this.sidebarService.open({
      component: DemoTinyContentComponent,
      headerConfig: { title: 'Short Content', showCloseButton: true },
      footerConfig: { primaryButton: { text: 'Got it' } },
      mobilePresentation: 'modal-sheet',
    });
  }

  // ─── 5. Stacking & Navigation ─────────────────────────

  async openStacked2(): Promise<void> {
    const ref1 = await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: { title: 'Step 1: Category', showCloseButton: true },
      footerConfig: {
        primaryButton: { text: 'Next' },
        secondaryButton: { text: 'Cancel' },
      },
      mobilePresentation: 'modal-sheet',
    });
    ref1
      .onDismiss()
      .then((r) => this.toast.info(`Layer 1: ${r.role}`, 'Stack'));

    setTimeout(async () => {
      const ref2 = await this.sidebarService.open({
        component: ModalSampleContentComponent,
        headerConfig: {
          title: 'Step 2: Details',
          subtitle: 'Stacked on top',
          showCloseButton: true,
          showBackButton: true,
        },
        footerConfig: {
          primaryButton: { text: 'Finish' },
          secondaryButton: { text: 'Back', variant: 'tertiary' },
        },
        mobilePresentation: 'modal-sheet',
      });
      ref2
        .onDismiss()
        .then((r) => this.toast.info(`Layer 2: ${r.role}`, 'Stack'));
    }, 500);
  }

  async openStackedForm(): Promise<void> {
    const ref = await this.sidebarService.open({
      component: DemoFormContentComponent,
      headerConfig: {
        title: 'Create Entry',
        subtitle: 'Fill in the details below',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Submit' },
        secondaryButton: { text: 'Cancel' },
      },
      mobilePresentation: 'modal-sheet',
    });
    const r = await ref.onDismiss();
    if (r.role === 'confirm') {
      this.toast.success('Entry created!', 'Success');
    }
  }

  async openDismissAll(): Promise<void> {
    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: { title: 'Layer 1', showCloseButton: true },
      footerConfig: { primaryButton: { text: 'Next' } },
      mobilePresentation: 'modal-sheet',
    });

    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Layer 2',
        showCloseButton: true,
        showBackButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Next' },
        secondaryButton: { text: 'Back', variant: 'tertiary' },
      },
      mobilePresentation: 'modal-sheet',
    });

    const ref = await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Layer 3',
        subtitle: 'Close dismisses entire stack',
        showCloseButton: true,
        showBackButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Save' },
        secondaryButton: { text: 'Back', variant: 'tertiary' },
      },
      mobilePresentation: 'modal-sheet',
      closeBehavior: 'all',
    });
    const r = await ref.onDismiss();
    this.toast.info(`Stack dismissed: ${r.role}`, 'Dismiss All');
  }

  async openDismissCurrent(): Promise<void> {
    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: { title: 'Layer 1', showCloseButton: true },
      footerConfig: { primaryButton: { text: 'Next' } },
      mobilePresentation: 'modal-sheet',
    });

    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Layer 2',
        showCloseButton: true,
        showBackButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Next' },
        secondaryButton: { text: 'Back', variant: 'tertiary' },
      },
      mobilePresentation: 'modal-sheet',
    });

    const ref = await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Layer 3',
        subtitle: 'Close dismisses only this layer',
        showCloseButton: true,
        showBackButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Save' },
        secondaryButton: { text: 'Back', variant: 'tertiary' },
      },
      mobilePresentation: 'modal-sheet',
      closeBehavior: 'current',
    });
    const r = await ref.onDismiss();
    this.toast.info(`Layer 3 closed: ${r.role}`, 'Dismiss Current');
  }

  // ─── 6. Dismiss Behavior ──────────────────────────────

  async openDismissDefault(): Promise<void> {
    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Default Dismiss',
        subtitle: 'Close button, backdrop tap, or drag header',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Done' },
        secondaryButton: { text: 'Cancel' },
      },
    });
  }

  async openDismissNoBackdrop(): Promise<void> {
    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'No Backdrop Dismiss',
        subtitle: 'Must use close button or footer buttons',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Confirm' },
        secondaryButton: { text: 'Cancel' },
      },
      backdropDismiss: false,
    });
  }

  async openDismissHandlebar(): Promise<void> {
    await this.sidebarService.open({
      component: ModalSampleContentComponent,
      headerConfig: {
        title: 'Handlebar Dismiss',
        subtitle: 'Drag the bar or tap backdrop to close',
      },
      footerConfig: {
        primaryButton: { text: 'Done' },
      },
      mobileHandle: true,
    });
  }
}
