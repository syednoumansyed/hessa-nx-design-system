import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { Component, inject } from '@angular/core';
import { IonApp } from '@ionic/angular/standalone';
import { expect, userEvent, within } from 'storybook/test';
import { DsFeedbackComponent } from '@ds/feedback/feedback.component';
import { DsFeedback, DsFeedbackType } from '@ds/feedback/feedback.type';
import {
  DsModalComponent,
  DsModalFooterConfig,
} from '@ds/modal/modal.component';
import { FeedbackService } from '@shared/services/feedback.service';
import { DsButtonComponent } from '@ds/button/button.component';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';

type FeedbackModalStoryArgs = DsFeedback & {
  dir?: 'ltr' | 'rtl';
};

const buildFooterConfig = (
  args: FeedbackModalStoryArgs,
): DsModalFooterConfig => {
  const primaryButtonVariant = DsFeedbackComponent.getPrimaryButtonVariant(
    args.type,
  );

  return {
    primaryButton: args.primaryBtnStr
      ? { text: args.primaryBtnStr, variant: primaryButtonVariant }
      : undefined,
    secondaryButton: args.secondaryBtnStr
      ? { text: args.secondaryBtnStr }
      : undefined,
    stackButtons: args.stackButtons,
  };
};

@Component({
  selector: 'story-feedback-service-launcher',
  standalone: true,
  imports: [DsButtonComponent],
  template: `
    <div
      class="flex min-h-72 flex-col items-center justify-center gap-ds-lg bg-surface-secondary-light p-ds-2xl"
    >
      <ds-button (click)="openSuccess()">Open feedback service modal</ds-button>
      <p class="content-sm-default text-content-mid">
        Last result: {{ lastResult }}
      </p>
    </div>
  `,
})
class StoryFeedbackServiceLauncherComponent {
  private readonly feedbackService = inject(FeedbackService);

  lastResult = 'not opened';

  async openSuccess(): Promise<void> {
    const confirmed = await this.feedbackService.openFeedbackModal(
      {
        type: 'success',
        modalTitle: 'Service Feedback',
        modalMessage: 'This modal was opened through FeedbackService.',
        primaryBtnStr: 'Save',
        secondaryBtnStr: 'Cancel',
      },
      () => {
        this.lastResult = 'confirm callback';
      },
      () => {
        this.lastResult = 'cancel callback';
      },
    );

    if (!confirmed && this.lastResult === 'not opened') {
      this.lastResult = 'dismissed';
    }
  }
}

const renderFeedbackModal = (args: FeedbackModalStoryArgs) => ({
  props: {
    ...args,
    footerConfig: buildFooterConfig(args),
  },
  template: `
    <div
      class="mx-auto w-full max-w-lg overflow-hidden rounded-ds-xl border border-stroke-mid bg-surface-primary"
      [attr.dir]="dir ?? 'ltr'"
    >
      <ds-modal
        [footerConfig]="footerConfig"
        modalSize="sm"
        contentClass="p-ds-xl"
        [scrollableContent]="false"
      >
        <ds-feedback
          [type]="type"
          [title]="modalTitle"
          [message]="modalMessage"
          [icon]="icon"
        />
      </ds-modal>
    </div>
  `,
});

/**
 * # Feedback Modal - `FeedbackService.openFeedbackModal()`
 *
 * Production feedback modals are opened via `FeedbackService`. That service wraps
 * `DsFeedbackComponent` in `DsModalService`, maps feedback type to the primary
 * button variant, and passes modal footer button labels through `footerConfig`.
 *
 * These stories render the same modal/content/footer contract directly so the
 * component remains inspectable in Storybook without launching an Ionic overlay.
 */
const meta: Meta<FeedbackModalStoryArgs> = {
  title: '1. P0 Components/Feedback Modal',
  component: DsFeedbackComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    a11y: { config: { rules: [] } },
    docs: {
      description: {
        component:
          'Renders ds-feedback inside ds-modal to match FeedbackService and DsModalService usage in the frontend app.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: [
        'success',
        'error',
        'warning',
        'question',
      ] satisfies DsFeedbackType[],
      description:
        'Feedback type. The primary footer variant is derived with DsFeedbackComponent.getPrimaryButtonVariant().',
    },
    modalTitle: {
      control: 'text',
      description: 'Title passed to DsFeedbackComponent as `title`.',
    },
    modalMessage: {
      control: 'text',
      description: 'Message passed to DsFeedbackComponent as `message`.',
    },
    primaryBtnStr: {
      control: 'text',
      description:
        'Creates footerConfig.primaryButton, matching FeedbackService.openFeedbackModal().',
    },
    secondaryBtnStr: {
      control: 'text',
      description:
        'Creates footerConfig.secondaryButton, matching FeedbackService.openFeedbackModal().',
    },
    stackButtons: {
      control: 'boolean',
      description: 'Passes through to footerConfig.stackButtons.',
    },
    dir: {
      control: 'inline-radio',
      options: ['ltr', 'rtl'],
      description: 'Story wrapper direction.',
    },
  },
  decorators: [
    withHessaProviders(),
    moduleMetadata({
      imports: [
        DsFeedbackComponent,
        DsModalComponent,
        IonApp,
        StoryFeedbackServiceLauncherComponent,
      ],
    }),
    componentWrapperDecorator(
      (story) => `<div class="w-full p-ds-2xl">${story}</div>`,
    ),
  ],
  render: renderFeedbackModal,
};

export default meta;
type Story = StoryObj<FeedbackModalStoryArgs>;

export const Success: Story = {
  args: {
    type: 'success',
    modalTitle: 'Operation Successful',
    modalMessage: 'The operation was completed successfully.',
    primaryBtnStr: 'Save',
    secondaryBtnStr: 'Cancel',
    dir: 'ltr',
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    modalTitle: 'Operation Failed',
    modalMessage: 'There was an error completing the operation.',
    primaryBtnStr: 'Try again',
    secondaryBtnStr: 'Cancel',
    dir: 'ltr',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    modalTitle: 'Warning',
    modalMessage: 'Please be cautious before continuing.',
    primaryBtnStr: 'Continue',
    secondaryBtnStr: 'Cancel',
    dir: 'ltr',
  },
};

export const Question: Story = {
  args: {
    type: 'question',
    modalTitle: 'Confirm deletion',
    modalMessage: 'This action cannot be undone. Do you want to continue?',
    primaryBtnStr: 'Confirm',
    secondaryBtnStr: 'Cancel',
    dir: 'ltr',
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    type: 'success',
    modalTitle: 'Grade Submitted',
    modalMessage: 'The grade has been recorded for this student.',
    primaryBtnStr: 'Save',
    secondaryBtnStr: 'Cancel',
    dir: 'ltr',
  },
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    type: 'success',
    modalTitle: 'تم الحفظ بنجاح',
    modalMessage: 'تم تسجيل الدرجة لهذا الطالب.',
    primaryBtnStr: 'حفظ',
    secondaryBtnStr: 'إلغاء',
    dir: 'rtl',
  },
};

export const ServiceContract: Story = {
  name: 'Service contract: FeedbackService',
  parameters: {
    docs: {
      description: {
        story:
          'Exercises FeedbackService.openFeedbackModal(), including DsModalService wrapping and confirm/cancel dismissal roles.',
      },
    },
  },
  render: () => ({
    template: `<ion-app><story-feedback-service-launcher /></ion-app>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open feedback service modal' }),
    );

    const body = within(document.body);
    await expect(await body.findByText('Service Feedback')).toBeInTheDocument();
    await userEvent.click(body.getByRole('button', { name: 'Save' }));
    await expect(
      await canvas.findByText('Last result: confirm callback'),
    ).toBeInTheDocument();
  },
};
