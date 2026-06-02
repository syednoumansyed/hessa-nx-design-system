import {
  Meta,
  StoryObj,
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular';
import { Component, inject, Input } from '@angular/core';
import { expect, userEvent, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { ModalSheetContainerComponent } from '@ds/modal-sheet/modal-sheet-container.component';
import { ModalSheetService } from '@ds/modal-sheet/modal-sheet.service';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsFeedbackComponent } from '@ds/feedback/feedback.component';
import { DsInputComponent } from '@ds/input/input.component';

type SheetScenario =
  | 'default'
  | 'ltr'
  | 'rtl'
  | 'disabled'
  | 'loading'
  | 'form';

@Component({
  selector: 'story-modal-sheet-summary',
  standalone: true,
  imports: [DsFeedbackComponent],
  template: `
    <ds-feedback
      type="info"
      title="Service content created"
      message="ModalSheetService.present() projected this standalone component into the custom sheet stack."
    />
  `,
})
class StoryModalSheetSummaryComponent {}

@Component({
  selector: 'story-modal-sheet-form',
  standalone: true,
  imports: [DsInputComponent],
  template: `
    <div class="flex flex-col gap-ds-lg">
      <app-ds-input
        label="Full name"
        inputValue="Ahmed Al-Rashid"
        placeholder="Enter full name"
      />
      <app-ds-input
        label="Email"
        inputValue="ahmed@school.edu.sa"
        placeholder="name@school.edu.sa"
        dsType="email"
      />
    </div>
  `,
})
class StoryModalSheetFormComponent {}

@Component({
  selector: 'story-modal-sheet-arabic',
  standalone: true,
  imports: [DsFeedbackComponent],
  template: `
    <div lang="ar" dir="rtl">
      <ds-feedback
        type="info"
        title="تم إنشاء المحتوى"
        message="تم عرض هذا المحتوى عبر خدمة ModalSheetService ومسار لوحة النموذج المخصص."
      />
    </div>
  `,
})
class StoryModalSheetArabicComponent {}

@Component({
  selector: 'story-modal-sheet-launcher',
  standalone: true,
  imports: [DsButtonComponent, ModalSheetContainerComponent],
  template: `
    <div class="flex h-full flex-col justify-end bg-surface-secondary-light">
      <div class="flex flex-col gap-ds-md p-ds-xl">
        <p class="content-sm-default text-content-mid">
          Custom ModalSheetService stack path. This is separate from DsModalService
          and Ionic ModalController bottom-sheet behavior.
        </p>
        <ds-button
          variant="primary"
          size="lg"
          [fullWidth]="true"
          (click)="openSheet()"
        >
          Open modal sheet
        </ds-button>
      </div>
      <ds-modal-sheet-container />
    </div>
  `,
})
class StoryModalSheetLauncherComponent {
  @Input() scenario: SheetScenario = 'default';

  private readonly modalSheetService = inject(ModalSheetService);

  openSheet(): void {
    const isRtl = this.scenario === 'rtl';
    const isForm = this.scenario === 'form';

    this.modalSheetService.present({
      component: isRtl
        ? StoryModalSheetArabicComponent
        : isForm
          ? StoryModalSheetFormComponent
          : StoryModalSheetSummaryComponent,
      headerConfig: {
        title: isRtl ? 'عنوان اللوحة' : 'Sheet Title',
        subtitle: isRtl
          ? 'مسار خدمة لوحة النموذج'
          : 'Presented through ModalSheetService',
        showBackButton: false,
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: {
          text:
            this.scenario === 'loading'
              ? 'Saving'
              : isRtl
                ? 'تأكيد'
                : 'Save changes',
          disabled: this.scenario === 'disabled',
          loading: this.scenario === 'loading',
        },
        secondaryButton: {
          text: isRtl ? 'إلغاء' : 'Cancel',
          disabled: this.scenario === 'disabled' || this.scenario === 'loading',
        },
        fullWidthButtons: true,
        buttonSize: 'lg',
      },
      contentClass: 'p-ds-xl',
      scrollableContent: true,
      backdropDismiss: true,
    });
  }
}

/**
 * # Modal Sheet - `ds-modal-sheet-container`
 *
 * Custom signal-stack bottom sheet rendered by `ModalSheetService`. This is not
 * the same runtime path as `DsModalService`, which uses Ionic `ModalController`
 * and `DsModalWrapperComponent`.
 */
const meta: Meta<ModalSheetContainerComponent> = {
  title: '3. P2 Components/ModalSheet',
  component: ModalSheetContainerComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile' },
    docs: {
      description: {
        component:
          'Mobile-first custom sheet stack. Stories open the sheet through ModalSheetService.present() and render ds-modal-sheet-container in the canvas.',
      },
    },
    a11y: { config: { rules: [] } },
  },
  argTypes: {},
  decorators: [
    withHessaProviders({ mobile: true, layout: true }),
    moduleMetadata({
      imports: [
        ModalSheetContainerComponent,
        StoryModalSheetLauncherComponent,
        StoryModalSheetSummaryComponent,
        StoryModalSheetFormComponent,
        StoryModalSheetArabicComponent,
      ],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div class="relative mx-auto h-[667px] w-[375px] overflow-hidden rounded-ds-2xl border-2 border-stroke-mid bg-surface-secondary-light">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<ModalSheetContainerComponent>;

const renderLauncher = (scenario: SheetScenario = 'default') => ({
  props: { scenario },
  template: `<story-modal-sheet-launcher [scenario]="scenario" />`,
});

const openSheet = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await userEvent.click(
    canvas.getByRole('button', { name: 'Open modal sheet' }),
  );
  return canvas;
};

export const Default: Story = {
  name: 'Default service path',
  render: () => renderLauncher('default'),
  play: async ({ canvasElement }) => {
    const canvas = await openSheet(canvasElement);
    await expect(await canvas.findByText('Sheet Title')).toBeInTheDocument();
    await expect(
      await canvas.findByText('Service content created'),
    ).toBeInTheDocument();
  },
};

export const FormSheet: Story = {
  name: 'Real form content',
  render: () => renderLauncher('form'),
  play: async ({ canvasElement }) => {
    const canvas = await openSheet(canvasElement);
    await expect(await canvas.findByLabelText('Full name')).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  name: 'State: Disabled footer actions',
  render: () => renderLauncher('disabled'),
  play: async ({ canvasElement }) => {
    const canvas = await openSheet(canvasElement);
    await expect(
      await canvas.findByRole('button', { name: 'Save changes' }),
    ).toBeDisabled();
    await expect(
      await canvas.findByRole('button', { name: 'Cancel' }),
    ).toBeDisabled();
  },
};

export const Loading: Story = {
  name: 'State: Loading primary action',
  render: () => renderLauncher('loading'),
  play: async ({ canvasElement }) => {
    const canvas = await openSheet(canvasElement);
    await expect(
      await canvas.findByRole('button', { name: 'Saving' }),
    ).toBeDisabled();
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => renderLauncher('ltr'),
  decorators: [withHessaProviders({ mobile: true, layout: true, locale: 'en' })],
  play: async ({ canvasElement }) => {
    const canvas = await openSheet(canvasElement);
    await expect(await canvas.findByText('Sheet Title')).toBeInTheDocument();
  },
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => renderLauncher('rtl'),
  decorators: [
    withHessaProviders({ mobile: true, layout: true, locale: 'ar' }),
    componentWrapperDecorator(
      (story) =>
        `<div class="relative mx-auto h-[667px] w-[375px] overflow-hidden rounded-ds-2xl border-2 border-stroke-mid bg-surface-secondary-light" lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = await openSheet(canvasElement);
    await expect(await canvas.findByText('عنوان اللوحة')).toBeInTheDocument();
  },
};
