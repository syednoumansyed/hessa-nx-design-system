import { Component, inject, input } from '@angular/core';
import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsToastComponent } from '@ds/toast/ds-toast.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';

@Component({
  selector: 'ds-toast-story-wrapper',
  standalone: true,
  imports: [DsButtonComponent],
  template: `
    <section
      class="flex w-full max-w-xl flex-col gap-ds-lg rounded-ds-xl border border-stroke-mid bg-surface-primary p-ds-xl"
    >
      <div class="flex flex-col gap-ds-sm">
        <h3 class="heading-h3-high-emphasis text-emphasis-high">
          {{ heading() }}
        </h3>
        <p class="content-sm-mid-emphasis text-emphasis-mid">
          {{ description() }}
        </p>
      </div>

      <div class="grid gap-ds-sm sm:grid-cols-2">
        <ds-button variant="primary" size="md" (click)="showToast('success')">
          Success toast
        </ds-button>
        <ds-button variant="dangerFill" size="md" (click)="showToast('error')">
          Error toast
        </ds-button>
        <ds-button variant="secondary" size="md" (click)="showToast('warning')">
          Warning toast
        </ds-button>
        <ds-button variant="tertiary" size="md" (click)="showToast('info')">
          Info toast
        </ds-button>
      </div>
    </section>
  `,
})
class DsToastStoryWrapperComponent {
  private readonly toast = inject(HesToasterService);

  readonly heading = input('Toast messages');
  readonly description = input(
    'Uses HesToasterService, DsToastComponent, and the same toast-base classes as the frontend app.',
  );

  showToast(type: 'success' | 'error' | 'warning' | 'info') {
    switch (type) {
      case 'success':
        this.toast.success('This is a success message', 'Success');
        break;
      case 'error':
        this.toast.error('This is an error message', 'Error');
        break;
      case 'warning':
        this.toast.warning('This is a warning message', 'Warning');
        break;
      case 'info':
        this.toast.info('This is an info message', 'Info');
        break;
    }
  }
}

/**
 * # Toast - `DsToastComponent`
 *
 * App-wide notification system using `ngx-toastr`, the custom `DsToastComponent`,
 * and the `HesToasterService` facade used throughout the frontend.
 *
 * **When to use:** immediate feedback on background operations such as save,
 * delete, connection, and export outcomes.
 * **When NOT to use:** blocking confirmations or decisions; use Feedback Modal
 * or Modal instead.
 */
const meta: Meta<DsToastStoryWrapperComponent> = {
  title: '2. P1 Components/Toast',
  component: DsToastStoryWrapperComponent,
  tags: ['autodocs'],
  decorators: [
    withHessaProviders({
      animations: 'browser',
      toaster: 'real',
      translations: {
        'global.wrong_msg.title': 'Something went wrong',
      },
    }),
    moduleMetadata({
      imports: [
        DsButtonComponent,
        DsToastComponent,
        DsToastStoryWrapperComponent,
      ],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div class="flex justify-center p-ds-2xl" lang="en" dir="ltr">${story}</div>`,
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The story intentionally calls HesToasterService instead of raw ToastrService so Storybook exercises the same toastClass, payload, timeout, and custom component path used in app code.',
      },
    },
  },
  argTypes: {
    heading: {
      control: 'text',
      description: 'Heading shown in the Storybook trigger panel.',
    },
    description: {
      control: 'text',
      description: 'Helper copy shown above the toast trigger buttons.',
    },
  },
};

export default meta;
type Story = StoryObj<DsToastStoryWrapperComponent>;

export const Default: Story = {
  args: {
    heading: 'Toast messages',
    description:
      'Uses HesToasterService, DsToastComponent, and the same toast-base classes as the frontend app.',
  },
};

export const ShowSuccessInteraction: Story = {
  ...Default,
  name: 'Interaction: success toast',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: /success toast/i }),
    );

    await expect(
      document.body.querySelector('.toast-base.toast-success'),
    ).toBeTruthy();
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    heading: 'Toast messages',
    description: 'Trigger app-style toast feedback in left-to-right layout.',
  },
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    heading: 'رسائل التنبيه',
    description: 'استخدم الأزرار لعرض تنبيهات مطابقة لتطبيق الواجهة.',
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div class="flex justify-center p-ds-2xl" lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
