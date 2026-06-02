import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { DsIconContainerComponent } from '@ds/icon-container/icon-container.component';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import {
  faHouse,
  faUser,
  faGraduationCap,
  faBell,
  faBook,
  faCalendar,
  faFileLines,
  faChartBar,
} from '@fortawesome/pro-regular-svg-icons';

/**
 * # Icon Container — `ds-icon-container`
 *
 * A large framed icon card used for subject/section navigation. Shows a 112×112px
 * rounded square with a coloured icon inside.
 *
 * **Optional decorations:**
 * - `chip` — badge pill anchored to the bottom of the frame
 * - `menu` — kebab menu button (top-right) for actions
 * - `hasIndicator` — animated unread-dot overlay
 * - `label` — caption text below the frame
 * - `isGrayed` — mutes the icon colour to `text-icon-low`
 *
 * **Config shape:**
 * ```ts
 * {
 *   icon: DsIcon;           // FA / ng-icon / SVG
 *   iconColorClass?: string; // Tailwind color class
 *   chip?: { text, variant, customClasses, startIcon, removable }
 *   menu?: { items: PopupItem[], position? }
 *   label?: string;
 *   hasIndicator?: boolean;
 *   isGrayed?: boolean;
 * }
 * ```
 */
const meta: Meta<DsIconContainerComponent> = {
  title: '2. P1 Components/Icon Container',
  component: DsIconContainerComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Large framed icon card for subject/section navigation. Supports chip badge, menu, indicator, label, and grayed state.',
      },
    },
    a11y: { config: { rules: [] } },
  },
  argTypes: {
    config: {
      control: 'object',
      description:
        'Icon container configuration: icon, color class, optional chip, menu, label, indicator, and grayed state',
    },
  },
  decorators: [
    withHessaProviders({ animations: 'browser' }),
    moduleMetadata({ imports: [DsIconContainerComponent] }),
    componentWrapperDecorator(
      (story) =>
        `<div style="padding:24px;display:flex;gap:24px;flex-wrap:wrap;">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsIconContainerComponent>;

// ─── Default ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default (icon only)',
  args: {
    config: {
      icon: faHouse,
      iconColorClass: 'text-primary-500',
    },
  },
};

// ─── With Label ───────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  name: 'With label',
  parameters: {
    docs: {
      description: {
        story:
          'A caption rendered below the frame, passed through `DsTranslatePipe`.',
      },
    },
  },
  args: {
    config: {
      icon: faGraduationCap,
      iconColorClass: 'text-secondary-500',
      label: 'Mathematics',
    },
  },
};

// ─── With Chip ────────────────────────────────────────────────────────────────

export const WithChip: Story = {
  name: 'With chip badge',
  parameters: {
    docs: {
      description: {
        story:
          'A chip pill anchored to the bottom-center of the frame, typically showing a subject grade or count.',
      },
    },
  },
  args: {
    config: {
      icon: faBook,
      iconColorClass: 'text-success-500',
      label: 'Science',
      chip: {
        text: 'A+',
        variant: 'success',
      },
    },
  },
};

// ─── Grayed ───────────────────────────────────────────────────────────────────

export const Grayed: Story = {
  name: 'Grayed (inactive)',
  parameters: {
    docs: {
      description: {
        story:
          '`isGrayed: true` overrides `iconColorClass` and applies `text-icon-low`, visually indicating an inactive or locked section.',
      },
    },
  },
  args: {
    config: {
      icon: faCalendar,
      iconColorClass: 'text-primary-500',
      label: 'Schedule',
      isGrayed: true,
    },
  },
};

// ─── All sizes/colors grid ────────────────────────────────────────────────────

export const IconGrid: Story = {
  name: 'Icon grid (multiple subjects)',
  parameters: {
    docs: {
      description: {
        story:
          'Typical usage: a grid of subject icon containers on a dashboard.',
      },
    },
  },
  render: () => ({
    props: {
      faHouse,
      faGraduationCap,
      faBook,
      faBell,
      faCalendar,
      faFileLines,
      faChartBar,
      faUser,
    },
    template: `
      <div style="display:flex;gap:20px;flex-wrap:wrap;padding:16px;background:#f9fafb;border-radius:16px;">
        <ds-icon-container [config]="{ icon: faGraduationCap, iconColorClass: 'text-primary-500',   label: 'Math' }"     />
        <ds-icon-container [config]="{ icon: faBook,          iconColorClass: 'text-success-500',   label: 'Science' }"  />
        <ds-icon-container [config]="{ icon: faFileLines,     iconColorClass: 'text-warning-500',   label: 'English' }"  />
        <ds-icon-container [config]="{ icon: faChartBar,      iconColorClass: 'text-info-500',      label: 'History' }"  />
        <ds-icon-container [config]="{ icon: faCalendar,      iconColorClass: 'text-secondary-500', label: 'Schedule' }" />
        <ds-icon-container [config]="{ icon: faUser,          iconColorClass: 'text-icon-low',      label: 'Locked', isGrayed: true }" />
      </div>
    `,
  }),
};

// ─── LTR ─────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    props: { faGraduationCap, faBook, faCalendar },
    template: `
      <div style="display:flex;gap:20px;flex-wrap:wrap;">
        <ds-icon-container [config]="{ icon: faGraduationCap, iconColorClass: 'text-primary-500',   label: 'Mathematics' }" />
        <ds-icon-container [config]="{ icon: faBook,          iconColorClass: 'text-success-500',   label: 'Science' }" />
        <ds-icon-container [config]="{ icon: faCalendar,      iconColorClass: 'text-secondary-500', label: 'Schedule' }" />
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    props: { faGraduationCap, faBook, faCalendar },
    template: `
      <div style="display:flex;gap:20px;flex-wrap:wrap;">
        <ds-icon-container [config]="{ icon: faGraduationCap, iconColorClass: 'text-primary-500',   label: 'الرياضيات' }" />
        <ds-icon-container [config]="{ icon: faBook,          iconColorClass: 'text-success-500',   label: 'العلوم' }"     />
        <ds-icon-container [config]="{ icon: faCalendar,      iconColorClass: 'text-secondary-500', label: 'الجدول' }"    />
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};
