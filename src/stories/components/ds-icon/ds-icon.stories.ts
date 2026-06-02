import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { DsIconComponent } from '@ds/icon/icon.component';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import {
  faHouse,
  faUser,
  faGear,
  faBell,
  faSearch,
  faPlus,
  faTrash,
  faEdit,
  faCheck,
  faXmark,
  faArrowRight,
  faArrowLeft,
  faChevronDown,
  faEnvelope,
  faPhone,
  faLock,
  faEye,
  faEyeSlash,
  faCircleInfo,
  faTriangleExclamation,
  faCircleCheck,
  faCircleXmark,
} from '@fortawesome/pro-regular-svg-icons';

/**
 * # Icon — `app-ds-icon`
 *
 * Unified icon wrapper used **403 times** across the app. Supports three icon sources:
 *
 * 1. **FontAwesome** (`IconDefinition` object from `@fortawesome/pro-regular-svg-icons`)
 * 2. **ng-icons** (`IconType` string from `@ng-icons/core` — heroicons, etc.)
 * 3. **SVG asset** (string path ending in `.svg` — loaded via `<ion-icon [src]>`)
 *
 * The component auto-detects the source from the `icon` input type.
 *
 * **Sizes:** FA uses the `SizeProp` keyword map (`xs`, `sm`, `lg`, `xl`, `2xl`) or a
 * numeric pixel value. ng-icons use the same keyword map translated to `em` values.
 *
 * **When to use:**
 * - Always use `app-ds-icon` instead of raw `<fa-icon>` or `<ng-icon>` — it normalises
 *   sizing, line-height, and display across all three sources.
 */
const meta: Meta<DsIconComponent> = {
  title: '1. P0 Components/Icon',
  component: DsIconComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Unified icon wrapper for FontAwesome, ng-icons (Heroicons), and SVG assets. Auto-detects source. 403 usages.',
      },
    },
    a11y: { config: { rules: [] } },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'lg', 'xl', '2xl', '16', '24', '32'],
      description: 'FA SizeProp keyword OR numeric pixel string',
    },
    cssClass: {
      control: 'text',
      description: 'Tailwind/CSS class applied to the inner icon element',
    },
  },
  decorators: [
    withHessaProviders(),
    moduleMetadata({ imports: [DsIconComponent] }),
    componentWrapperDecorator(
      (story) => `<div style="padding:16px;">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsIconComponent>;

// ─── FontAwesome ──────────────────────────────────────────────────────────────

export const FontAwesomeDefault: Story = {
  name: 'FontAwesome icon',
  parameters: {
    docs: {
      description: {
        story:
          'Pass an `IconDefinition` object (imported from `@fortawesome/pro-regular-svg-icons`) to the `icon` input. This is the most common usage — 90%+ of icons in the app are FA.',
      },
    },
  },
  render: () => ({
    props: { faHouse, faUser, faGear, faBell, faSearch },
    template: `
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
        <app-ds-icon [icon]="faHouse" size="xl" />
        <app-ds-icon [icon]="faUser"  size="xl" />
        <app-ds-icon [icon]="faGear"  size="xl" />
        <app-ds-icon [icon]="faBell"  size="xl" />
        <app-ds-icon [icon]="faSearch" size="xl" />
      </div>
    `,
  }),
};

export const FontAwesomeSizes: Story = {
  name: 'FontAwesome — all sizes',
  parameters: {
    docs: {
      description: {
        story:
          'All standard FA size keywords: `xs` (10px) → `sm` (14px) → `lg` (20px) → `xl` (24px) → `2xl` (32px). Also accepts a numeric pixel value as a string.',
      },
    },
  },
  render: () => ({
    props: { faHouse },
    template: `
      <div style="display:flex;gap:20px;align-items:flex-end;flex-wrap:wrap;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <app-ds-icon [icon]="faHouse" size="xs" />
          <span style="font-size:10px;color:#6b7280;">xs</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <app-ds-icon [icon]="faHouse" size="sm" />
          <span style="font-size:10px;color:#6b7280;">sm</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <app-ds-icon [icon]="faHouse" size="lg" />
          <span style="font-size:10px;color:#6b7280;">lg</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <app-ds-icon [icon]="faHouse" size="xl" />
          <span style="font-size:10px;color:#6b7280;">xl</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <app-ds-icon [icon]="faHouse" size="2xl" />
          <span style="font-size:10px;color:#6b7280;">2xl</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <app-ds-icon [icon]="faHouse" size="48px" />
          <span style="font-size:10px;color:#6b7280;">48px</span>
        </div>
      </div>
    `,
  }),
};

export const FontAwesomeColors: Story = {
  name: 'FontAwesome — with color classes',
  parameters: {
    docs: {
      description: {
        story:
          'Use the `cssClass` input to apply Tailwind color utilities. The class is forwarded to the inner `<fa-icon>` element.',
      },
    },
  },
  render: () => ({
    props: {
      faCircleCheck,
      faTriangleExclamation,
      faCircleXmark,
      faCircleInfo,
    },
    template: `
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
        <app-ds-icon [icon]="faCircleCheck"        size="xl" cssClass="text-success-500" />
        <app-ds-icon [icon]="faTriangleExclamation" size="xl" cssClass="text-warning-500" />
        <app-ds-icon [icon]="faCircleXmark"        size="xl" cssClass="text-error-ds-600" />
        <app-ds-icon [icon]="faCircleInfo"         size="xl" cssClass="text-info-500" />
      </div>
    `,
  }),
};

export const Disabled: Story = {
  name: 'State: Disabled / muted',
  parameters: {
    docs: {
      description: {
        story:
          'Icons do not own disabled behavior; consumers pass low-emphasis color classes when the surrounding action is disabled.',
      },
    },
  },
  render: () => ({
    props: { faLock, faEyeSlash, faBell },
    template: `
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
        <app-ds-icon [icon]="faLock"     size="xl" cssClass="text-content-low" />
        <app-ds-icon [icon]="faEyeSlash" size="xl" cssClass="text-icon-low" />
        <app-ds-icon [icon]="faBell"     size="xl" cssClass="text-black-40" />
      </div>
    `,
  }),
};

export const Error: Story = {
  name: 'State: Error / destructive',
  parameters: {
    docs: {
      description: {
        story:
          'Error and destructive icon states are represented through semantic error color utilities passed via `cssClass`.',
      },
    },
  },
  render: () => ({
    props: { faCircleXmark, faTriangleExclamation, faTrash },
    template: `
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
        <app-ds-icon [icon]="faCircleXmark"         size="xl" cssClass="text-error-ds-600" />
        <app-ds-icon [icon]="faTriangleExclamation" size="xl" cssClass="text-warning-500" />
        <app-ds-icon [icon]="faTrash"               size="xl" cssClass="text-content-error" />
      </div>
    `,
  }),
};

// ─── Common UI icon set ───────────────────────────────────────────────────────

export const CommonIcons: Story = {
  name: 'Common UI icons',
  parameters: {
    docs: {
      description: {
        story:
          'Frequently-used icons across the Hessa app, all at `xl` (24px). These appear in buttons, inputs, nav bars, and status indicators.',
      },
    },
  },
  render: () => ({
    props: {
      faPlus,
      faTrash,
      faEdit,
      faCheck,
      faXmark,
      faArrowRight,
      faArrowLeft,
      faChevronDown,
      faEnvelope,
      faPhone,
      faLock,
      faEye,
      faEyeSlash,
    },
    template: `
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;background:#f9fafb;padding:16px;border-radius:12px;">
        <app-ds-icon [icon]="faPlus"         size="xl" title="faPlus" />
        <app-ds-icon [icon]="faTrash"        size="xl" />
        <app-ds-icon [icon]="faEdit"         size="xl" />
        <app-ds-icon [icon]="faCheck"        size="xl" />
        <app-ds-icon [icon]="faXmark"        size="xl" />
        <app-ds-icon [icon]="faArrowRight"   size="xl" />
        <app-ds-icon [icon]="faArrowLeft"    size="xl" />
        <app-ds-icon [icon]="faChevronDown"  size="xl" />
        <app-ds-icon [icon]="faEnvelope"     size="xl" />
        <app-ds-icon [icon]="faPhone"        size="xl" />
        <app-ds-icon [icon]="faLock"         size="xl" />
        <app-ds-icon [icon]="faEye"          size="xl" />
        <app-ds-icon [icon]="faEyeSlash"     size="xl" />
      </div>
    `,
  }),
};

// ─── LTR ─────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    props: { faArrowRight },
    template: `
      <div style="display:flex;gap:8px;align-items:center;">
        <span style="font-family:'Nunito',sans-serif;font-size:14px;">Next step</span>
        <app-ds-icon [icon]="faArrowRight" size="lg" />
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="padding:16px;">${story}</div>`,
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    props: { faArrowLeft },
    template: `
      <div style="display:flex;gap:8px;align-items:center;">
        <span style="font-family:'Lama Rounded',sans-serif;font-size:14px;">الخطوة التالية</span>
        <app-ds-icon [icon]="faArrowLeft" size="lg" />
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="padding:16px;">${story}</div>`,
    ),
  ],
};
