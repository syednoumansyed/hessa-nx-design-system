import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { ModalSheetContainerComponent } from '@ds/modal-sheet/modal-sheet-container.component';
import { ModalSheetService } from '@ds/modal-sheet/modal-sheet.service';
import { DS_TRANSLATION_TOKEN } from '@ds/i18n/ds-translation.token';

// ─── Dummy content component for stories ──────────────────────────────────────

@Component({
  selector: 'story-sheet-content',
  standalone: true,
  template: `
    <div style="padding:16px;font-family:inherit">
      <p style="color:#374151;line-height:1.6;margin:0 0 12px">
        This is the scrollable content area of the modal sheet.
        In production, any Angular component can be injected here
        via <code>ModalSheetService.present()</code>.
      </p>
      <p style="color:#6b7280;line-height:1.6;margin:0">
        The sheet slides up from the bottom (90dvh) with a rounded top and
        a semi-transparent backdrop above it.
      </p>
    </div>
  `,
})
class StorySheetContentComponent {}

@Component({
  selector: 'story-sheet-content-form',
  standalone: true,
  template: `
    <div style="padding:16px;font-family:inherit;display:flex;flex-direction:column;gap:12px">
      <div>
        <label style="display:block;font-size:14px;font-weight:600;color:#374151;margin-bottom:4px">Full Name</label>
        <input type="text" placeholder="Enter your name"
          style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box" />
      </div>
      <div>
        <label style="display:block;font-size:14px;font-weight:600;color:#374151;margin-bottom:4px">Email</label>
        <input type="email" placeholder="Enter your email"
          style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box" />
      </div>
      <div>
        <label style="display:block;font-size:14px;font-weight:600;color:#374151;margin-bottom:4px">Grade</label>
        <select style="width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box">
          <option>Grade 1</option>
          <option>Grade 2</option>
          <option selected>Grade 3</option>
          <option>Grade 4</option>
          <option>Grade 5</option>
        </select>
      </div>
    </div>
  `,
})
class StorySheetFormContentComponent {}

@Component({
  selector: 'story-sheet-content-arabic',
  standalone: true,
  template: `
    <div style="padding:16px;font-family:'Lama Rounded',sans-serif;direction:rtl;text-align:right">
      <p style="color:#374151;line-height:1.8;margin:0 0 12px">
        هذه منطقة المحتوى القابلة للتمرير في لوحة النموذج.
        في الإنتاج، يمكن حقن أي مكوّن Angular هنا عبر
        <code>ModalSheetService.present()</code>.
      </p>
      <p style="color:#6b7280;line-height:1.8;margin:0">
        تنزلق اللوحة لأعلى من الأسفل مع زوايا مدوّرة في الأعلى.
      </p>
    </div>
  `,
})
class StorySheetArabicContentComponent {}

// ─── Factory: seed ModalSheetService with an entry ───────────────────────────

function makeSheetProvider(
  title: string,
  subtitle: string | undefined,
  showBack: boolean,
  showClose: boolean,
  contentComponent: unknown,
  primaryLabel?: string,
  secondaryLabel?: string,
) {
  return {
    provide: ModalSheetService,
    useFactory: () => {
      const svc = new ModalSheetService();
      svc.present({
        component: contentComponent as never,
        headerConfig: {
          title,
          subtitle,
          showBackButton: showBack,
          showCloseButton: showClose,
        },
        ...(primaryLabel || secondaryLabel
          ? {
              footerConfig: {
                ...(primaryLabel
                  ? { primaryButton: { text: primaryLabel } }
                  : {}),
                ...(secondaryLabel
                  ? { secondaryButton: { text: secondaryLabel } }
                  : {}),
                fullWidthButtons: true,
              },
            }
          : {}),
        backdropDismiss: false,
      });
      return svc;
    },
  };
}

// ─── Base provider helpers ─────────────────────────────────────────────────────

const baseProviders = [
  provideIonicAngular(),
  {
    provide: DS_TRANSLATION_TOKEN,
    useValue: {
      translate: (key: string) => key,
      getActiveLang: () => 'en',
    },
  },
];

/**
 * # Modal Sheet — `ds-modal-sheet-container`
 *
 * A bottom-sheet overlay for mobile viewports (375px recommended). Managed entirely
 * by `ModalSheetService` — call `.present({ component, headerConfig, footerConfig })`
 * to push a sheet onto the stack.
 *
 * **Note:** This is a mobile-first component. It occupies 90dvh of the viewport and
 * slides up from the bottom. Stories are constrained to a 375×667px mobile frame.
 *
 * **Key features:**
 * - Stack-based: multiple sheets can be presented simultaneously.
 * - Standard header with title, subtitle, back/close buttons.
 * - Scrollable content area with any Angular component injected dynamically.
 * - Optional primary/secondary footer buttons.
 * - Backdrop dismiss (configurable).
 * - RTL-ready.
 */
const meta: Meta<ModalSheetContainerComponent> = {
  title: '3. P2 Components/ModalSheet',
  component: ModalSheetContainerComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Bottom-sheet overlay for mobile. Managed by ModalSheetService — present/dismiss sheets imperatively. Supports stacking, custom headers, footers, and RTL layouts. Constrain to a mobile viewport (≤ 375px) for correct visual output.',
      },
    },
    a11y: { config: { rules: [] } },
    layout: 'fullscreen',
  },
  argTypes: {},
  decorators: [
    moduleMetadata({
      imports: [
        ModalSheetContainerComponent,
        StorySheetContentComponent,
        StorySheetFormContentComponent,
        StorySheetArabicContentComponent,
        NgClass,
      ],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div style="position:relative;width:375px;height:667px;overflow:hidden;background:#f3f4f6;border:1px solid #d1d5db;border-radius:16px;margin:auto;font-family:'Nunito',sans-serif">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<ModalSheetContainerComponent>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default (Header + Content)',
  decorators: [
    applicationConfig({
      providers: [
        ...baseProviders,
        makeSheetProvider(
          'Sheet Title',
          undefined,
          false,
          true,
          StorySheetContentComponent,
        ),
      ],
    }),
  ],
  render: () => ({
    template: `<ds-modal-sheet-container></ds-modal-sheet-container>`,
  }),
};

export const WithSubtitle: Story = {
  name: 'With Subtitle',
  decorators: [
    applicationConfig({
      providers: [
        ...baseProviders,
        makeSheetProvider(
          'Select a Course',
          'Choose the course you want to review',
          false,
          true,
          StorySheetContentComponent,
        ),
      ],
    }),
  ],
  render: () => ({
    template: `<ds-modal-sheet-container></ds-modal-sheet-container>`,
  }),
};

export const WithBackButton: Story = {
  name: 'With Back Button',
  decorators: [
    applicationConfig({
      providers: [
        ...baseProviders,
        makeSheetProvider(
          'Assignment Details',
          'Math — Unit 3',
          true,
          true,
          StorySheetContentComponent,
        ),
      ],
    }),
  ],
  render: () => ({
    template: `<ds-modal-sheet-container></ds-modal-sheet-container>`,
  }),
};

export const WithFooterButtons: Story = {
  name: 'With Footer Buttons',
  decorators: [
    applicationConfig({
      providers: [
        ...baseProviders,
        makeSheetProvider(
          'Confirm Enrollment',
          'Review your selection before confirming',
          false,
          true,
          StorySheetContentComponent,
          'Confirm',
          'Cancel',
        ),
      ],
    }),
  ],
  render: () => ({
    template: `<ds-modal-sheet-container></ds-modal-sheet-container>`,
  }),
};

export const FormSheet: Story = {
  name: 'Real-World: Form Sheet',
  decorators: [
    applicationConfig({
      providers: [
        ...baseProviders,
        makeSheetProvider(
          'Edit Profile',
          'Update your personal information',
          false,
          true,
          StorySheetFormContentComponent,
          'Save Changes',
          'Cancel',
        ),
      ],
    }),
  ],
  render: () => ({
    template: `<ds-modal-sheet-container></ds-modal-sheet-container>`,
  }),
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  decorators: [
    applicationConfig({
      providers: [
        provideIonicAngular(),
        {
          provide: DS_TRANSLATION_TOKEN,
          useValue: {
            translate: (key: string) => key,
            getActiveLang: () => 'ar',
          },
        },
        makeSheetProvider(
          'عنوان اللوحة',
          'اختر الخيار المناسب',
          false,
          true,
          StorySheetArabicContentComponent,
          'تأكيد',
          'إلغاء',
        ),
      ],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div dir="rtl" lang="ar" style="position:relative;width:375px;height:667px;overflow:hidden;background:#f3f4f6;border:1px solid #d1d5db;border-radius:16px;margin:auto;font-family:'Lama Rounded',sans-serif">${story}</div>`,
    ),
  ],
  render: () => ({
    template: `<ds-modal-sheet-container></ds-modal-sheet-container>`,
  }),
};
