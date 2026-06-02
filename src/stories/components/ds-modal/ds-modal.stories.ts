import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { Component, inject } from '@angular/core';
import { IonApp } from '@ionic/angular/standalone';
import { expect, userEvent, within } from 'storybook/test';
import { DsModalComponent } from '@ds/modal/modal.component';
import { DsModalService } from '@ds/modal/modal.service';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsFeedbackComponent } from '@ds/feedback/feedback.component';
import { DsInputComponent } from '@ds/input/input.component';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';

@Component({
  selector: 'story-modal-service-launcher',
  standalone: true,
  imports: [DsButtonComponent],
  template: `
    <div
      class="flex min-h-72 flex-col items-center justify-center gap-ds-lg bg-surface-secondary-light p-ds-2xl"
    >
      <ds-button (click)="openModal()">Open service modal</ds-button>
      <p class="content-sm-default text-content-mid">
        Last result: {{ lastResult }}
      </p>
    </div>
  `,
})
class StoryModalServiceLauncherComponent {
  private readonly modalService = inject(DsModalService);

  lastResult = 'not opened';

  async openModal(): Promise<void> {
    const modalRef = await this.modalService.open({
      component: DsFeedbackComponent,
      componentProps: {
        type: 'success',
        title: 'Service content created',
        message:
          'DsModalService.open() projected this standalone app component through DsModalWrapperComponent.',
      },
      headerConfig: {
        title: 'Service Modal',
        showBackButton: false,
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Confirm' },
        secondaryButton: { text: 'Cancel' },
      },
      size: 'sm',
      contentClass: 'p-ds-xl',
      scrollableContent: true,
    });

    const result = await modalRef.onDismiss();
    this.lastResult = result.role ?? 'dismissed';
  }
}

/**
 * # Modal — `ds-modal`
 *
 * Full-screen overlay dialog shell. Provides a consistent header (title, subtitle,
 * back/close buttons) and footer (primary/secondary action buttons). Body content is
 * projected via `<ng-content>` — use `render: () => ({ template })` in Storybook.
 *
 * In production, modals are opened via `DsModalService.open()`. In Storybook these
 * stories include direct shell inspection plus service-contract launchers.
 *
 * **When to use:** Confirmation dialogs, focused data entry, detail overlays.
 * **When NOT to use:** Toast-style feedback → use `ds-toast`. Page navigation → use router.
 *
 * **Sizes:**
 * - `sm` — narrow dialog (≈361px)
 * - `md` — standard width
 * - `lg` — full-sheet / sidebar (default)
 *
 * **Header config:** `{ title, subtitle?, showBackButton?, showCloseButton? }`
 * **Footer config:** `{ primaryButton, secondaryButton?, buttonSize?, fullWidthButtons?, stackButtons? }`
 */
const meta: Meta<DsModalComponent> = {
  title: '1. P0 Components/Modal',
  component: DsModalComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Modal shell with header, scrollable body (ng-content), and footer. Direct stories inspect layout; service-contract stories open the production DsModalService wrapper.',
      },
    },
    a11y: { config: { rules: [] } },
    layout: 'fullscreen',
  },
  argTypes: {
    modalSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description:
        'Modal width preset passed to the modal shell and footer layout.',
    },
    headerConfig: {
      control: 'object',
      description:
        'Header object: { title, subtitle, showBackButton, showCloseButton }.',
    },
    footerConfig: {
      control: 'object',
      description:
        'Footer object: { primaryButton, secondaryButton, buttonSize, fullWidthButtons, stackButtons }.',
    },
    contentClass: {
      control: 'text',
      description: 'Utility classes applied to the projected content wrapper.',
    },
    headerClass: {
      control: 'text',
      description: 'Utility classes applied to the header wrapper.',
    },
    footerClass: {
      control: 'text',
      description: 'Utility classes applied to the footer wrapper.',
    },
    scrollableContent: {
      control: 'boolean',
      description: 'Keeps header/footer fixed while the body region scrolls.',
    },
    respectTopSafeArea: {
      control: 'boolean',
      description: 'Adds top padding based on iOS safe-area inset.',
    },
  },
  decorators: [
    withHessaProviders({ mobile: false }),
    moduleMetadata({
      imports: [
        DsModalComponent,
        IonApp,
        DsButtonComponent,
        DsFeedbackComponent,
        DsInputComponent,
        StoryModalServiceLauncherComponent,
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<DsModalComponent>;

// ─── Default (sm) ────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default (size: sm)',
  parameters: {
    docs: {
      description: {
        story:
          'Small modal (≈361px) with header title + close button, body text, and primary/secondary footer buttons. The most common confirmation dialog pattern.',
      },
    },
  },
  render: () => ({
    template: `
      <ds-modal
        [headerConfig]="{ title: 'Confirm Action', showBackButton: false, showCloseButton: true }"
        [footerConfig]="{ primaryButton: { text: 'Confirm' }, secondaryButton: { text: 'Cancel' }, buttonSize: 'lg' }"
        modalSize="sm"
        contentClass="p-ds-xl"
      >
        <p class="content-md-default text-content-high">
          Are you sure you want to proceed? This action cannot be undone and all associated
          data will be permanently removed.
        </p>
      </ds-modal>
    `,
  }),
};

export const Disabled: Story = {
  name: 'State: Disabled footer actions',
  parameters: {
    docs: {
      description: {
        story:
          'Footer buttons support disabled states via `footerConfig.primaryButton.disabled` and `footerConfig.secondaryButton.disabled`.',
      },
    },
  },
  render: () => ({
    template: `
      <ds-modal
        [headerConfig]="{ title: 'Locked Action', showBackButton: false, showCloseButton: true }"
        [footerConfig]="{ primaryButton: { text: 'Confirm', disabled: true }, secondaryButton: { text: 'Cancel', disabled: true }, buttonSize: 'lg' }"
        modalSize="sm"
        contentClass="p-ds-xl"
      >
        <p class="content-md-default text-content-high">
          This action is unavailable until all required fields are complete.
        </p>
      </ds-modal>
    `,
  }),
};

export const Loading: Story = {
  name: 'State: Loading primary action',
  parameters: {
    docs: {
      description: {
        story:
          'Footer buttons support loading states via `footerConfig.primaryButton.loading`; the primary action is disabled while the spinner is visible.',
      },
    },
  },
  render: () => ({
    template: `
      <ds-modal
        [headerConfig]="{ title: 'Saving Changes', showBackButton: false, showCloseButton: true }"
        [footerConfig]="{ primaryButton: { text: 'Saving...', loading: true }, secondaryButton: { text: 'Cancel' }, buttonSize: 'lg' }"
        modalSize="sm"
        contentClass="p-ds-xl"
      >
        <p class="content-md-default text-content-high">
          The modal footer keeps secondary navigation visible while the primary action is processing.
        </p>
      </ds-modal>
    `,
  }),
};

// ─── Size: md ────────────────────────────────────────────────────────────────

export const SizeMd: Story = {
  name: 'Size: md',
  parameters: {
    docs: {
      description: {
        story:
          'Medium-width modal — wider than `sm`, narrower than the full-sheet `lg`. Good for forms with 3–5 fields.',
      },
    },
  },
  render: () => ({
    template: `
      <ds-modal
        [headerConfig]="{ title: 'Edit Student Profile', showBackButton: false, showCloseButton: true }"
        [footerConfig]="{ primaryButton: { text: 'Save changes' }, secondaryButton: { text: 'Discard' }, buttonSize: 'lg', fullWidthButtons: true }"
        modalSize="md"
        contentClass="p-ds-xl"
      >
        <div class="flex flex-col gap-ds-lg">
          <app-ds-input
            label="Full name"
            inputValue="Ahmed Al-Rashid"
            [readOnly]="true"
          />
          <app-ds-input
            label="Grade"
            inputValue="5-A"
            [readOnly]="true"
          />
          <app-ds-input
            label="Email"
            inputValue="ahmed@school.edu.sa"
            dsType="email"
            [readOnly]="true"
          />
        </div>
      </ds-modal>
    `,
  }),
};

// ─── Size: lg ────────────────────────────────────────────────────────────────

export const SizeLg: Story = {
  name: 'Size: lg (full-sheet)',
  parameters: {
    docs: {
      description: {
        story:
          '`modalSize="lg"` is the default. On mobile this renders as a bottom sheet; on desktop it becomes a sidebar-width panel. Use for detail views or multi-step flows.',
      },
    },
  },
  render: () => ({
    template: `
      <ds-modal
        [headerConfig]="{ title: 'Student Details', showBackButton: true, showCloseButton: true }"
        [footerConfig]="{ primaryButton: { text: 'Edit profile' }, secondaryButton: { text: 'Close' }, buttonSize: 'lg' }"
        modalSize="lg"
        contentClass="p-ds-xl"
      >
        <dl class="flex flex-col gap-ds-md text-content-high">
          <div class="flex justify-between gap-ds-lg border-b border-stroke-cool-black-08 pb-ds-md">
            <dt class="single-line-xs-mid-emphasis text-content-mid">Student ID</dt>
            <dd class="content-md-mid-emphasis text-end">STU-20240042</dd>
          </div>
          <div class="flex justify-between gap-ds-lg border-b border-stroke-cool-black-08 pb-ds-md">
            <dt class="single-line-xs-mid-emphasis text-content-mid">Full name</dt>
            <dd class="content-md-mid-emphasis text-end">Ahmed Al-Rashid</dd>
          </div>
          <div class="flex justify-between gap-ds-lg border-b border-stroke-cool-black-08 pb-ds-md">
            <dt class="single-line-xs-mid-emphasis text-content-mid">Grade</dt>
            <dd class="content-md-mid-emphasis text-end">5-A</dd>
          </div>
          <div class="flex justify-between gap-ds-lg border-b border-stroke-cool-black-08 pb-ds-md">
            <dt class="single-line-xs-mid-emphasis text-content-mid">Attendance</dt>
            <dd class="content-md-mid-emphasis text-content-success">94%</dd>
          </div>
          <div class="flex justify-between gap-ds-lg">
            <dt class="single-line-xs-mid-emphasis text-content-mid">Email</dt>
            <dd class="content-md-mid-emphasis text-end">ahmed@school.edu.sa</dd>
          </div>
        </dl>
      </ds-modal>
    `,
  }),
};

// ─── With Subtitle ───────────────────────────────────────────────────────────

export const WithSubtitle: Story = {
  name: 'With subtitle',
  parameters: {
    docs: {
      description: {
        story:
          '`headerConfig.subtitle` renders a secondary line below the title. Useful for context or step indicators (e.g. "Step 2 of 3").',
      },
    },
  },
  render: () => ({
    template: `
      <ds-modal
        [headerConfig]="{ title: 'Add Subject', subtitle: 'Choose from available subjects for this semester', showBackButton: true, showCloseButton: true }"
        [footerConfig]="{ primaryButton: { text: 'Add subject' }, secondaryButton: { text: 'Cancel' }, buttonSize: 'lg' }"
        modalSize="sm"
        contentClass="p-ds-xl"
      >
        <div class="flex flex-col gap-ds-md text-content-high" role="listbox">
          <div
            class="content-md-default flex items-center gap-ds-md rounded-ds-xl border-2 border-stroke-mid bg-surface-primary p-ds-lg"
            aria-selected="false"
            role="option"
          >
            <span class="flex h-9 w-9 items-center justify-center rounded-ds-full bg-pastels-blue-50 text-ds-base font-extrabold text-pastels-blue-400">M</span>
            <span>Mathematics</span>
          </div>
          <div
            class="content-md-default flex items-center gap-ds-md rounded-ds-xl border-2 border-stroke-mid bg-surface-primary p-ds-lg"
            aria-selected="false"
            role="option"
          >
            <span class="flex h-9 w-9 items-center justify-center rounded-ds-full bg-surface-success-subtle text-ds-base font-extrabold text-content-success">S</span>
            <span>Science</span>
          </div>
          <div
            class="content-md-mid-emphasis flex items-center gap-ds-md rounded-ds-xl border-2 border-brand-500 bg-brand-100 p-ds-lg text-emphasis-high"
            aria-selected="true"
            role="option"
          >
            <span class="flex h-9 w-9 items-center justify-center rounded-ds-full bg-brand-200 text-ds-base font-extrabold text-brand-700">E</span>
            <span>English ✓</span>
          </div>
        </div>
      </ds-modal>
    `,
  }),
};

// ─── No Footer ───────────────────────────────────────────────────────────────

export const NoFooter: Story = {
  name: 'No footer',
  parameters: {
    docs: {
      description: {
        story:
          'When `footerConfig` is omitted, the footer section is not rendered. Use for read-only detail views where no action is needed.',
      },
    },
  },
  render: () => ({
    template: `
      <ds-modal
        [headerConfig]="{ title: 'Student Details', showCloseButton: true, showBackButton: false }"
        modalSize="sm"
        contentClass="p-ds-xl"
      >
        <dl class="flex flex-col gap-ds-md text-content-high">
          <div class="flex justify-between gap-ds-lg">
            <dt class="single-line-xs-mid-emphasis text-content-mid">Name</dt>
            <dd class="content-md-mid-emphasis text-end">Ahmed Al-Rashid</dd>
          </div>
          <div class="flex justify-between gap-ds-lg">
            <dt class="single-line-xs-mid-emphasis text-content-mid">Grade</dt>
            <dd class="content-md-mid-emphasis text-end">5-A</dd>
          </div>
          <div class="flex justify-between gap-ds-lg">
            <dt class="single-line-xs-mid-emphasis text-content-mid">Student ID</dt>
            <dd class="content-md-mid-emphasis text-end">STU-20240042</dd>
          </div>
          <div class="flex justify-between gap-ds-lg">
            <dt class="single-line-xs-mid-emphasis text-content-mid">Status</dt>
            <dd class="content-md-mid-emphasis text-content-success">Active</dd>
          </div>
        </dl>
      </ds-modal>
    `,
  }),
};

// ─── Scrollable Content ───────────────────────────────────────────────────────

export const ScrollableContent: Story = {
  name: 'Scrollable content',
  parameters: {
    docs: {
      description: {
        story:
          '`scrollableContent=true` switches the body region to `min-h-0 flex-1 overflow-y-auto` so the header and footer remain sticky while long content scrolls. The `.ds-modal-inner` class is also applied to the root.',
      },
    },
  },
  render: () => ({
    template: `
      <ds-modal
        [headerConfig]="{ title: 'Terms & Conditions', showCloseButton: true, showBackButton: false }"
        [footerConfig]="{ primaryButton: { text: 'I agree' }, secondaryButton: { text: 'Decline' }, buttonSize: 'lg', fullWidthButtons: true }"
        [scrollableContent]="true"
        modalSize="sm"
        contentClass="p-ds-xl"
      >
        <div class="content-sm-default flex flex-col gap-ds-md text-content-high">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
            fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
            laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
            architecto beatae vitae dicta sunt explicabo.
          </p>
          <p>
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
            consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro
            quisquam est, qui dolorem ipsum quia dolor sit amet.
          </p>
          <p>
            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium
            voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint
            occaecati cupiditate non provident.
          </p>
        </div>
      </ds-modal>
    `,
  }),
};

// ─── Mobile Notch ────────────────────────────────────────────────────────────

export const MobileNotch: Story = {
  name: 'Mobile notch (safe area)',
  parameters: {
    docs: {
      description: {
        story: `
\`respectTopSafeArea=true\` adds \`pt-[max(env(safe-area-inset-top),18px)]\` to the root container.

This ensures the modal header does not overlap the device status bar / dynamic island on iOS.
Use this whenever the modal is presented as a full-screen overlay rather than a sheet that
slides up from the bottom.

> **Note:** The CSS env variable \`safe-area-inset-top\` resolves to \`0\` in desktop browsers.
> Switch to a mobile device preset in the Device Toolbar and enable "Show device frame" to
> see the safe area padding take effect.
        `,
      },
    },
  },
  render: () => ({
    template: `
      <ds-modal
        [headerConfig]="{ title: 'Full Screen Modal', showBackButton: false, showCloseButton: true }"
        [footerConfig]="{ primaryButton: { text: 'Done' }, buttonSize: 'lg' }"
        [respectTopSafeArea]="true"
        modalSize="lg"
        contentClass="p-ds-xl"
      >
        <div class="flex flex-col gap-ds-md">
          <p class="content-md-default text-content-high">
            This modal respects the device safe area (notch / dynamic island) via
            <code class="rounded-ds-sm bg-surface-secondary-light px-ds-xs text-content-high">env(safe-area-inset-top)</code>.
          </p>
          <p class="content-sm-default text-content-mid">
            On desktop the top padding defaults to 18px. On iOS with a notch it will be larger.
          </p>
        </div>
      </ds-modal>
    `,
  }),
};

// ─── LTR ─────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  parameters: {
    docs: {
      description: {
        story:
          'Left-to-right layout with English title and button text. Wrapper overrides `dir` for documentation purposes.',
      },
    },
  },
  render: () => ({
    template: `
      <ds-modal
        [headerConfig]="{ title: 'Select Grade', showBackButton: true, showCloseButton: true }"
        [footerConfig]="{ primaryButton: { text: 'Select' }, secondaryButton: { text: 'Cancel' }, buttonSize: 'lg' }"
        modalSize="sm"
        contentClass="p-ds-xl"
      >
        <p class="content-md-default text-content-high">
          Select a grade level to continue with the enrollment process.
        </p>
      </ds-modal>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" class="text-content-high">${story}</div>`,
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  parameters: {
    docs: {
      description: {
        story:
          'Right-to-left layout with Arabic title and button text. The back/close button positions and text alignment mirror correctly under `dir="rtl"`.',
      },
    },
  },
  render: () => ({
    template: `
      <ds-modal
        [headerConfig]="{ title: 'اختر الصف الدراسي', subtitle: 'اختر من الصفوف المتاحة', showBackButton: true, showCloseButton: true }"
        [footerConfig]="{ primaryButton: { text: 'اختر' }, secondaryButton: { text: 'إلغاء' }, buttonSize: 'lg' }"
        modalSize="sm"
        contentClass="p-ds-xl"
      >
        <p class="content-md-default text-content-high">
          اختر صفاً دراسياً للمتابعة في عملية التسجيل.
        </p>
      </ds-modal>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" class="text-content-high">${story}</div>`,
    ),
  ],
};

export const InteractiveTrigger: Story = {
  name: 'Interactive Trigger (Open/Close)',
  render: () => ({
    template: `
      <div class="flex min-h-72 flex-col items-center justify-center bg-surface-secondary-light p-ds-2xl text-center">
        <ds-button (click)="isOpen = true">
          Open Modal
        </ds-button>
        
        @if (isOpen) {
          <ds-modal
            [headerConfig]="{ title: 'Interactive Modal', showBackButton: false, showCloseButton: true }"
            [footerConfig]="{ primaryButton: { text: 'Done' }, buttonSize: 'lg' }"
            modalSize="sm"
            contentClass="p-ds-xl"
            (closeClick)="isOpen = false"
            (primaryClick)="isOpen = false"
          >
            <p class="content-md-default text-start text-content-high">
              This modal was opened interactively. Click the close icon or 'Done' to close it.
            </p>
          </ds-modal>
        }
      </div>
    `,
    props: {
      isOpen: false,
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggerBtn = canvas.getByRole('button', { name: 'Open Modal' });
    await expect(triggerBtn).toBeInTheDocument();

    // Click the button to open the modal
    await userEvent.click(triggerBtn);

    // Verify modal content appears in DOM
    const modalTitle = await canvas.findByText('Interactive Modal');
    await expect(modalTitle).toBeInTheDocument();

    // Close the modal via header close icon
    const closeBtn = canvas.getByRole('button', { name: 'Close modal' });
    await expect(closeBtn).toBeInTheDocument();
    await userEvent.click(closeBtn);

    // Verify modal is closed (title no longer in document)
    await expect(modalTitle).not.toBeInTheDocument();
  },
};

export const ServiceContractDesktop: Story = {
  name: 'Service contract: desktop dialog',
  parameters: {
    docs: {
      description: {
        story:
          'Exercises DsModalService.open() on the desktop Platform branch. This validates the production wrapper, footer roles, and Ionic overlay path instead of only rendering the ds-modal shell.',
      },
    },
  },
  render: () => ({
    template: `<ion-app><story-modal-service-launcher /></ion-app>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open service modal' }),
    );

    const body = within(document.body);
    await expect(await body.findByText('Service Modal')).toBeInTheDocument();
    await userEvent.click(body.getByRole('button', { name: 'Confirm' }));
    await expect(
      await canvas.findByText('Last result: confirm'),
    ).toBeInTheDocument();
  },
};

export const ServiceContractMobileSheet: Story = {
  name: 'Service contract: mobile bottom sheet',
  parameters: {
    docs: {
      description: {
        story:
          'Exercises DsModalService.open() with a mobile Platform mock. This is Ionic modal bottom-sheet behavior, distinct from the P2 ModalSheetService stack.',
      },
    },
  },
  decorators: [withHessaProviders({ mobile: true })],
  render: () => ({
    template: `<ion-app><story-modal-service-launcher /></ion-app>`,
  }),
};
