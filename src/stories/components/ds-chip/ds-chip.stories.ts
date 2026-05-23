import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsChipComponent } from '@ds/chip/chip.component';
import { faBook, faStar, faGraduationCap, faTag } from '@fortawesome/pro-regular-svg-icons';

/**
 * # Chip — `app-ds-chip`
 *
 * Compact label/tag component for displaying selected items, filters, or categories.
 * Used 77 times. Two display types (`pill`, `card`) and three base variants.
 *
 * **Inputs:**
 * - `text` — label string rendered inside the chip
 * - `variant` — `'default'` | `'primary'` | `'none'` (or any custom string)
 * - `displayType` — `'pill'` (rounded, compact) | `'card'` (rounded-md, larger padding)
 * - `startIcon` — FontAwesome icon shown before the text
 * - `startIconSize` — override icon size (`'sm'` default for pill, `'lg'` default for card)
 * - `startIconColorClass` — Tailwind colour class applied to the icon
 * - `removable` — shows an × button; emits `remove` output when clicked
 * - `static` — disables hover effects; use for read-only/display contexts
 *
 * **Note:** `DsChipComponent` does **not** have a `disabled` input — use `static` for
 * view-only chips, or wrap in a disabled form control at the parent level.
 *
 * **When to use:** Tags, selected filter values, category badges, removable items.
 * **When NOT to use:** Primary actions → use `ds-button`. Navigation → use `ds-tabs`.
 */
const meta: Meta<DsChipComponent> = {
  title: '1. P0 Components/Chip',
  component: DsChipComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    a11y: { config: { rules: [] } },
  },
  argTypes: {
    text: { control: 'text', description: 'Label text displayed inside the chip' },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'none'],
      description: 'Colour variant — controls background and border',
    },
    displayType: {
      control: 'select',
      options: ['pill', 'card'],
      description: 'Shape preset — pill is fully rounded; card uses rounded-md with more padding',
    },
    removable: { control: 'boolean', description: 'Renders an × icon that emits the `remove` output on click' },
    static: { control: 'boolean', description: 'Disables hover effects; use for view-only/read-only chips' },
    startIconSize: { control: 'text' },
    startIconColorClass: { control: 'text' },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsChipComponent] }),
    componentWrapperDecorator(
      (story) => `<div style="padding:16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsChipComponent>;

// ---------------------------------------------------------------------------
// Pill variants
// ---------------------------------------------------------------------------

/** Default pill chip — neutral border and background, no hover-state colour shift. */
export const Default: Story = {
  args: {
    text: 'Label',
    variant: 'default',
    displayType: 'pill',
  },
};

/** Primary pill chip — brand-coloured border and tinted background. */
export const Primary: Story = {
  args: {
    text: 'Primary',
    variant: 'primary',
    displayType: 'pill',
  },
};

/** Pill chip with a leading icon. The icon size follows the `computedIconSize` logic (`sm` for pill). */
export const PillWithIcon: Story = {
  name: 'Pill with icon',
  args: {
    text: 'Science',
    variant: 'default',
    displayType: 'pill',
    startIcon: faBook,
  },
};

/**
 * Removable chip — renders a circular × button on the trailing edge.
 * The chip emits the `remove` output when the × is clicked; the parent is
 * responsible for removing it from the list.
 */
export const Removable: Story = {
  args: {
    text: 'Removable tag',
    variant: 'primary',
    displayType: 'pill',
    removable: true,
  },
};

/**
 * Static chip — identical appearance to a regular chip but with no hover effects.
 * Use when displaying read-only tags in a detail view or summary panel.
 */
export const StaticPill: Story = {
  name: 'Static (view-only)',
  args: {
    text: 'Read-only',
    variant: 'default',
    displayType: 'pill',
    static: true,
  },
};

// ---------------------------------------------------------------------------
// Card display type
// ---------------------------------------------------------------------------

/**
 * Card chip — `rounded-ds-md` corners and `p-ds-md` padding give it a tile-like
 * appearance. Suited for category or subject cards.
 */
export const CardDisplay: Story = {
  name: 'Display: card',
  args: {
    text: 'Card Chip',
    variant: 'default',
    displayType: 'card',
  },
};

/**
 * Card chip with a leading icon — the icon automatically scales to `lg` for the
 * card display type via `computedIconSize`.
 */
export const CardWithIcon: Story = {
  name: 'Display: card with icon',
  args: {
    text: 'Grade 5-A',
    variant: 'default',
    displayType: 'card',
    startIcon: faStar,
  },
};

// ---------------------------------------------------------------------------
// Combination showcases
// ---------------------------------------------------------------------------

/** Side-by-side overview of all pill variants and states. */
export const AllPillVariants: Story = {
  name: 'All Pill Variants',
  render: () => ({
    template: `
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
        <app-ds-chip text="Default"       variant="default"  displayType="pill"></app-ds-chip>
        <app-ds-chip text="Primary"       variant="primary"  displayType="pill"></app-ds-chip>
        <app-ds-chip text="With Icon"     variant="default"  displayType="pill" [startIcon]="bookIcon"></app-ds-chip>
        <app-ds-chip text="Removable"     variant="primary"  displayType="pill" [removable]="true"></app-ds-chip>
        <app-ds-chip text="Static"        variant="default"  displayType="pill" [static]="true"></app-ds-chip>
      </div>
    `,
    props: {
      bookIcon: faBook,
    },
  }),
};

/** Side-by-side overview of all card variants. */
export const AllCardVariants: Story = {
  name: 'All Card Variants',
  render: () => ({
    template: `
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
        <app-ds-chip text="Card Default"  variant="default" displayType="card"></app-ds-chip>
        <app-ds-chip text="Card Primary"  variant="primary" displayType="card"></app-ds-chip>
        <app-ds-chip text="Card + Icon"   variant="default" displayType="card" [startIcon]="starIcon"></app-ds-chip>
        <app-ds-chip text="Card Static"   variant="default" displayType="card" [static]="true"></app-ds-chip>
      </div>
    `,
    props: {
      starIcon: faStar,
    },
  }),
};

// ---------------------------------------------------------------------------
// Disabled note
// ---------------------------------------------------------------------------

/**
 * `DsChipComponent` does **not** expose a `disabled` input.
 *
 * For view-only contexts, use `[static]="true"` — this removes hover effects while
 * keeping the chip visually active. For truly non-interactive chips in a form,
 * disable the parent form control; the chip itself does not propagate disabled state.
 */
export const DisabledNote: Story = {
  name: 'No disabled state — use static',
  args: {
    text: 'View-only (static)',
    variant: 'primary',
    displayType: 'pill',
    static: true,
  },
};

// ---------------------------------------------------------------------------
// LTR / RTL
// ---------------------------------------------------------------------------

/** Left-to-right layout — English labels, `Nunito` font. */
export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    template: `
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
        <app-ds-chip text="Mathematics"  variant="primary"  displayType="pill"></app-ds-chip>
        <app-ds-chip text="Science"      variant="default"  displayType="pill"></app-ds-chip>
        <app-ds-chip text="English"      variant="default"  displayType="pill" [removable]="true"></app-ds-chip>
        <app-ds-chip text="Grade 5-A"   variant="default"  displayType="card" [startIcon]="starIcon"></app-ds-chip>
      </div>
    `,
    props: { starIcon: faStar },
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};

/** Right-to-left layout — Arabic labels, `Lama Rounded` font. */
export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
        <app-ds-chip text="تصنيف"        variant="primary"  displayType="pill"></app-ds-chip>
        <app-ds-chip text="الرياضيات"    variant="default"  displayType="pill"></app-ds-chip>
        <app-ds-chip text="العلوم"       variant="default"  displayType="pill" [removable]="true"></app-ds-chip>
        <app-ds-chip text="الصف الخامس" variant="default"  displayType="card" [startIcon]="tagIcon"></app-ds-chip>
      </div>
    `,
    props: { tagIcon: faTag },
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};
