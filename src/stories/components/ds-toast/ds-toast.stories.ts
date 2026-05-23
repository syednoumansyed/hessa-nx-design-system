import { Component, inject } from '@angular/core';
import { ToastrService, provideToastr } from 'ngx-toastr';
import {
  Meta,
  StoryObj,
  moduleMetadata,
  applicationConfig,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DsToastComponent } from '@ds/toast/ds-toast.component';

@Component({
  selector: 'ds-toast-story-wrapper',
  standalone: true,
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px; padding: 24px; max-width: 320px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
      <h3 style="margin-top: 0; font-size: 14px; color: #374151; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Nunito', sans-serif;">
        Toast System
      </h3>
      <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px; font-family: 'Nunito', sans-serif;">
        Click any button to trigger the custom design system toast notification at the top-right.
      </p>
      <button (click)="showToast('success')" style="padding: 10px; background: #16a34a; color: white; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-family: 'Nunito', sans-serif; transition: background 0.15s;" onmouseover="this.style.background='#15803d'" onmouseout="this.style.background='#16a34a'">
        Show Success Toast
      </button>
      <button (click)="showToast('error')" style="padding: 10px; background: #dc2626; color: white; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-family: 'Nunito', sans-serif; transition: background 0.15s;" onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'">
        Show Error Toast
      </button>
      <button (click)="showToast('warning')" style="padding: 10px; background: #ea580c; color: white; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-family: 'Nunito', sans-serif; transition: background 0.15s;" onmouseover="this.style.background='#c2410c'" onmouseout="this.style.background='#ea580c'">
        Show Warning Toast
      </button>
      <button (click)="showToast('info')" style="padding: 10px; background: #2563eb; color: white; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-family: 'Nunito', sans-serif; transition: background 0.15s;" onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
        Show Info Toast
      </button>
    </div>
  `,
})
class DsToastStoryWrapperComponent {
  private readonly toastr = inject(ToastrService);

  showToast(type: 'success' | 'error' | 'warning' | 'info') {
    const titleMap = {
      success: 'Action successful',
      error: 'Request failed',
      warning: 'Warning limit reached',
      info: 'Update available',
    };
    const msgMap = {
      success: 'Your student enrollment changes have been saved successfully.',
      error: 'We were unable to process your request. Please try again.',
      warning: 'You have reached the maximum number of daily login attempts.',
      info: 'A new version of the curriculum syllabus has been published.',
    };

    if (type === 'success') {
      this.toastr.success(msgMap.success, titleMap.success);
    } else if (type === 'error') {
      this.toastr.error(msgMap.error, titleMap.error);
    } else if (type === 'warning') {
      this.toastr.warning(msgMap.warning, titleMap.warning);
    } else {
      this.toastr.info(msgMap.info, titleMap.info);
    }
  }
}

/**
 * # Toast — `DsToastComponent`
 *
 * App-wide notification system utilizing `ngx-toastr`. It renders floating alert banners in
 * response to asynchronous events.
 *
 * **When to use:**
 * - Immediate feedback on background operations (e.g., "Changes saved", "Failed to connect")
 * - High-level system notices
 *
 * **When NOT to use:**
 * - Complex or critical interactive choices → use `ds-modal`
 * - In-page contextual feedback → use `ds-alert-message`
 */
const meta: Meta<DsToastStoryWrapperComponent> = {
  title: '2. P1 Components/Toast',
  component: DsToastStoryWrapperComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        provideAnimations(),
        provideToastr({
          toastComponent: DsToastComponent,
          timeOut: 6000,
          closeButton: true,
          positionClass: 'toast-top-right',
        }),
      ],
    }),
    moduleMetadata({
      imports: [DsToastComponent],
      declarations: [DsToastStoryWrapperComponent],
    }),
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:32px;display:flex;justify-content:center;">${story}</div>`
    ),
  ],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<DsToastStoryWrapperComponent>;

export const Default: Story = {};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  decorators: [
    componentWrapperDecorator(
      (story) => `
        <div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:32px;display:flex;justify-content:center;">
          ${story}
        </div>
      `
    ),
  ],
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; padding: 24px; max-width: 320px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: right;">
        <h3 style="margin-top: 0; font-size: 14px; color: #374151; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Lama Rounded', sans-serif;">
          نظام التنبيهات
        </h3>
        <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px; font-family: 'Lama Rounded', sans-serif;">
          اضغط على أي زر لإطلاق التنبيه في أعلى اليمين.
        </p>
        <button (click)="showToast('success')" style="padding: 10px; background: #16a34a; color: white; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-family: 'Lama Rounded', sans-serif; transition: background 0.15s;" onmouseover="this.style.background='#15803d'" onmouseout="this.style.background='#16a34a'">
          تنبيه نجاح
        </button>
        <button (click)="showToast('error')" style="padding: 10px; background: #dc2626; color: white; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-family: 'Lama Rounded', sans-serif; transition: background 0.15s;" onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'">
          تنبيه خطأ
        </button>
      </div>
    `,
  }),
};
