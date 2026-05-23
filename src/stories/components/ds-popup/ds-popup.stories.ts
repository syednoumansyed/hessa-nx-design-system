import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DsMenuComponent } from '@ds/popup/ds-menu.component';
import { faTrash, faPen, faShare, faCopy } from '@fortawesome/pro-regular-svg-icons';
import type { PopupItem } from '@ds/popup/types/popup.interface';

/**
 * # Popup Menu — `ds-menu`
 *
 * A context-menu / action-list popup using Angular CDK overlay positioning.
 * Renders a floating menu anchored to a trigger element with support for
 * nested submenus, state variants, and icon decoration.
 *
 * **When to use:**
 * - Three-dot (⋯) action menus on cards, rows, or list items
 * - Right-click context menus
 *
 * **When NOT to use:**
 * - Navigation menus (use the `sidebar` or `tabs` components)
 * - Selection pickers (use `app-ds-select` or `app-ds-picker-select`)
 *
 * **Responsive tokens:** Menu panel uses `--ds-spacing-md`/`--ds-corner-radius-md`.
 */
const meta: Meta<DsMenuComponent> = {
  title: '2. P1 Components/Popup Menu',
  component: DsMenuComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Context / action popup menu backed by Angular CDK overlay. Supports nested submenus, item states (default/danger/success), and icon decoration.',
      },
    },
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
  argTypes: {
    items: { control: 'object' },
    selectedValues: { control: 'object' },
  },
  decorators: [
    applicationConfig({
      providers: [
        provideIonicAngular(),
        provideAnimations(),
      ],
    }),
    moduleMetadata({ imports: [DsMenuComponent] }),
  ],
};

export default meta;
type Story = StoryObj<DsMenuComponent>;

const basicItems: PopupItem[] = [
  { title: 'Edit', icon: faPen, action: () => {} },
  { title: 'Duplicate', icon: faCopy, action: () => {} },
  { title: 'Share', icon: faShare, action: () => {} },
  { title: 'Delete', icon: faTrash, state: 'danger', action: () => {} },
];

// ─── Basic ────────────────────────────────────────────────────────────────────

export const Basic: Story = {
  args: {
    items: basicItems,
  },
};

// ─── With States ──────────────────────────────────────────────────────────────

export const WithStates: Story = {
  name: 'With States (default / danger / success)',
  args: {
    items: [
      { title: 'Approve', state: 'success', action: () => {} },
      { title: 'Edit', state: 'default', action: () => {} },
      { title: 'Reject', state: 'danger', action: () => {} },
    ],
  },
};

// ─── With Subtitles ───────────────────────────────────────────────────────────

export const WithSubtitles: Story = {
  name: 'With Subtitles',
  args: {
    items: [
      { title: 'Download PDF', subtitle: 'Saves a copy to your device', icon: faCopy, action: () => {} },
      { title: 'Share link', subtitle: 'Copies a shareable URL', icon: faShare, action: () => {} },
    ],
  },
};

// ─── Selectable Items ─────────────────────────────────────────────────────────

export const SelectableItems: Story = {
  name: 'Selectable (radio style)',
  args: {
    items: [
      { id: 'all', title: 'All students', selectable: true, action: () => {} },
      { id: 'present', title: 'Present only', selectable: true, action: () => {} },
      { id: 'absent', title: 'Absent only', selectable: true, action: () => {} },
    ],
    selectedValues: ['all'],
  },
};

// ─── With Disabled Items ──────────────────────────────────────────────────────

export const WithDisabledItems: Story = {
  name: 'With Disabled Items',
  args: {
    items: [
      { title: 'Edit', icon: faPen, action: () => {} },
      { title: 'Export (unavailable)', icon: faShare, disabled: true, action: () => {} },
      { title: 'Delete', icon: faTrash, state: 'danger', action: () => {} },
    ],
  },
};

// ─── LTR ──────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    items: basicItems,
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};

// ─── RTL ──────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    items: [
      { title: 'تعديل', icon: faPen, action: () => {} },
      { title: 'نسخ', icon: faCopy, action: () => {} },
      { title: 'مشاركة', icon: faShare, action: () => {} },
      { title: 'حذف', icon: faTrash, state: 'danger', action: () => {} },
    ],
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};
