import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsModalComponent } from '@ds/modal/modal.component';

/**
 * # Modal — `ds-modal`
 *
 * Full-screen overlay dialog shell. Provides a consistent header (title, subtitle,
 * back/close buttons) and footer (primary/secondary action buttons). Body content is
 * projected via `<ng-content>` — use `render: () => ({ template })` in Storybook.
 *
 * In production, modals are opened via `DsModalService.open()`. In Storybook these
 * stories render the shell directly so the layout is visible without service setup.
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
          'Modal shell with header, scrollable body (ng-content), and footer. Open via DsModalService in production; rendered directly in Storybook for layout visibility.',
      },
    },
    a11y: { config: { rules: [] } },
    layout: 'fullscreen',
  },
  // Modal inputs are objects — keep argTypes empty to avoid TS noise in controls panel
  argTypes: {},
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsModalComponent] }),
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
      >
        <div style="color:#374151;font-size:15px;line-height:1.6;">
          Are you sure you want to proceed? This action cannot be undone and all associated
          data will be permanently removed.
        </div>
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
      >
        <div style="color:#374151;font-size:15px;line-height:1.8;display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:13px;font-weight:600;color:#6b7280;">Full name</label>
            <div style="border:1px solid #d1d5db;border-radius:8px;padding:10px 14px;color:#111827;">Ahmed Al-Rashid</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:13px;font-weight:600;color:#6b7280;">Grade</label>
            <div style="border:1px solid #d1d5db;border-radius:8px;padding:10px 14px;color:#111827;">5-A</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:13px;font-weight:600;color:#6b7280;">Email</label>
            <div style="border:1px solid #d1d5db;border-radius:8px;padding:10px 14px;color:#111827;">ahmed@school.edu.sa</div>
          </div>
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
      >
        <div style="color:#374151;font-size:15px;line-height:1.8;display:flex;flex-direction:column;gap:16px;">
          <div style="display:flex;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid #f3f4f6;">
            <span style="color:#6b7280;font-size:13px;">Student ID</span>
            <span style="font-weight:600;">STU-20240042</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid #f3f4f6;">
            <span style="color:#6b7280;font-size:13px;">Full name</span>
            <span style="font-weight:600;">Ahmed Al-Rashid</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid #f3f4f6;">
            <span style="color:#6b7280;font-size:13px;">Grade</span>
            <span style="font-weight:600;">5-A</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid #f3f4f6;">
            <span style="color:#6b7280;font-size:13px;">Attendance</span>
            <span style="font-weight:600;color:#16a34a;">94%</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#6b7280;font-size:13px;">Email</span>
            <span style="font-weight:600;">ahmed@school.edu.sa</span>
          </div>
        </div>
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
      >
        <div style="color:#374151;font-size:15px;line-height:1.6;display:flex;flex-direction:column;gap:8px;">
          <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;display:flex;align-items:center;gap:12px;">
            <div style="width:36px;height:36px;border-radius:50%;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-weight:700;color:#3b82f6;">M</div>
            <span>Mathematics</span>
          </div>
          <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;display:flex;align-items:center;gap:12px;">
            <div style="width:36px;height:36px;border-radius:50%;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-weight:700;color:#16a34a;">S</div>
            <span>Science</span>
          </div>
          <div style="padding:12px;border:2px solid #3b82f6;border-radius:8px;display:flex;align-items:center;gap:12px;background:#eff6ff;">
            <div style="width:36px;height:36px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-weight:700;color:#1d4ed8;">E</div>
            <span style="font-weight:600;">English ✓</span>
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
      >
        <div style="color:#374151;font-size:15px;display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#6b7280;font-size:13px;">Name</span>
            <span style="font-weight:600;">Ahmed Al-Rashid</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#6b7280;font-size:13px;">Grade</span>
            <span style="font-weight:600;">5-A</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#6b7280;font-size:13px;">Student ID</span>
            <span style="font-weight:600;">STU-20240042</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#6b7280;font-size:13px;">Status</span>
            <span style="font-weight:600;color:#16a34a;">Active</span>
          </div>
        </div>
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
      >
        <div style="color:#374151;font-size:14px;line-height:1.8;">
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
      >
        <div style="color:#374151;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 8px;">
            This modal respects the device safe area (notch / dynamic island) via
            <code>env(safe-area-inset-top)</code>.
          </p>
          <p style="margin:0;font-size:13px;color:#6b7280;">
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
      >
        <div style="color:#374151;font-size:15px;line-height:1.6;">
          Select a grade level to continue with the enrollment process.
        </div>
      </ds-modal>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;">${story}</div>`,
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
      >
        <div style="color:#374151;font-size:15px;line-height:1.8;">
          اختر صفاً دراسياً للمتابعة في عملية التسجيل.
        </div>
      </ds-modal>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;">${story}</div>`,
    ),
  ],
};

export const InteractiveTrigger: Story = {
  name: 'Interactive Trigger (Open/Close)',
  render: () => ({
    template: `
      <div style="padding: 24px; text-align: center;">
        <button id="open-modal-btn" (click)="isOpen = true" style="background:#3b82f6;color:white;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;">
          Open Modal
        </button>
        
        @if (isOpen) {
          <ds-modal
            [headerConfig]="{ title: 'Interactive Modal', showBackButton: false, showCloseButton: true }"
            [footerConfig]="{ primaryButton: { text: 'Done' }, buttonSize: 'lg' }"
            modalSize="sm"
            (closeClick)="isOpen = false"
            (primaryClick)="isOpen = false"
          >
            <div style="color:#374151;font-size:15px;line-height:1.6;text-align:left;">
              This modal was opened interactively. Click the close icon or 'Done' to close it.
            </div>
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
