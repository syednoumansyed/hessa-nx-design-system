import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { UserProfileColors } from '@shared/enums';

/**
 * # Avatar — `app-ds-avatar`
 *
 * Displays a user's avatar — either a photo or generated initials with a
 * colour-coded background. Supports 8 sizes and 10 colour variants.
 *
 * **When to use:**
 * - Represent a user in lists, headers, comment threads, or profile pages
 * - Use `imageUrl` when the user has a photo; the component falls back to initials automatically
 *
 * **Initials logic:** The component takes only the **first character** of
 * `fullName` (uppercased). A single-letter initial is always shown.
 *
 * **Border:** `includeBorder` defaults to `true` — set to `false` to remove the
 * thin dark stroke.
 */
const meta: Meta<AvatarComponent> = {
  title: '1. P0 Components/Avatar',
  component: AvatarComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'User avatar with photo or initials fallback. 8 sizes × 10 colour variants. RTL-safe.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'],
    },
    color: {
      control: 'select',
      options: Object.values(UserProfileColors),
    },
    includeBorder: { control: 'boolean' },
    imageUrl: { control: 'text' },
    fullName: { control: 'text' },
  },
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [AvatarComponent] }),
  ],
};

export default meta;
type Story = StoryObj<AvatarComponent>;

// ---------------------------------------------------------------------------
// Default — initials fallback
// ---------------------------------------------------------------------------
export const Default: Story = {
  args: {
    fullName: 'Ahmed Al-Rashid',
    size: 'md',
    includeBorder: true,
    color: UserProfileColors.NEUTRAL,
  },
};

// ---------------------------------------------------------------------------
// With Image
// ---------------------------------------------------------------------------
export const WithImage: Story = {
  args: {
    fullName: 'Sara Johnson',
    imageUrl: 'https://i.pravatar.cc/150?img=1',
    size: 'md',
    includeBorder: true,
  },
};

// ---------------------------------------------------------------------------
// With Border
// ---------------------------------------------------------------------------
export const WithBorder: Story = {
  args: {
    fullName: 'Khaled Nasser',
    size: 'lg',
    includeBorder: true,
    color: UserProfileColors.BRAND,
  },
};

// ---------------------------------------------------------------------------
// All Sizes
// ---------------------------------------------------------------------------
export const AllSizes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'All 8 avatar sizes rendered side-by-side with size labels.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="display:flex; align-items:flex-end; gap:24px; flex-wrap:wrap; padding:16px;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Ahmed Al-Rashid" size="xs" [includeBorder]="true"></app-ds-avatar>
          <span style="font-size:11px;color:#666">xs</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Ahmed Al-Rashid" size="sm" [includeBorder]="true"></app-ds-avatar>
          <span style="font-size:11px;color:#666">sm</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Ahmed Al-Rashid" size="md" [includeBorder]="true"></app-ds-avatar>
          <span style="font-size:11px;color:#666">md</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Ahmed Al-Rashid" size="lg" [includeBorder]="true"></app-ds-avatar>
          <span style="font-size:11px;color:#666">lg</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Ahmed Al-Rashid" size="xl" [includeBorder]="true"></app-ds-avatar>
          <span style="font-size:11px;color:#666">xl</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Ahmed Al-Rashid" size="2xl" [includeBorder]="true"></app-ds-avatar>
          <span style="font-size:11px;color:#666">2xl</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Ahmed Al-Rashid" size="3xl" [includeBorder]="true"></app-ds-avatar>
          <span style="font-size:11px;color:#666">3xl</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Ahmed Al-Rashid" size="4xl" [includeBorder]="true"></app-ds-avatar>
          <span style="font-size:11px;color:#666">4xl</span>
        </div>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// All Colors
// ---------------------------------------------------------------------------
export const AllColors: Story = {
  parameters: {
    docs: {
      description: {
        story: 'All 10 `UserProfileColors` rendered with distinct initials.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="display:flex; gap:16px; flex-wrap:wrap; padding:16px; align-items:flex-end;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Brand" size="2xl" color="brand" [includeBorder]="false"></app-ds-avatar>
          <span style="font-size:11px;color:#666">brand</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Emerald" size="2xl" color="emerald" [includeBorder]="false"></app-ds-avatar>
          <span style="font-size:11px;color:#666">emerald</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Blue" size="2xl" color="blue" [includeBorder]="false"></app-ds-avatar>
          <span style="font-size:11px;color:#666">blue</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Green" size="2xl" color="green" [includeBorder]="false"></app-ds-avatar>
          <span style="font-size:11px;color:#666">green</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Yellow" size="2xl" color="yellow" [includeBorder]="false"></app-ds-avatar>
          <span style="font-size:11px;color:#666">yellow</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Neutral" size="2xl" color="neutral" [includeBorder]="false"></app-ds-avatar>
          <span style="font-size:11px;color:#666">neutral</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Coral" size="2xl" color="coral" [includeBorder]="false"></app-ds-avatar>
          <span style="font-size:11px;color:#666">coral</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Teal" size="2xl" color="teal" [includeBorder]="false"></app-ds-avatar>
          <span style="font-size:11px;color:#666">teal</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Purple" size="2xl" color="purple" [includeBorder]="false"></app-ds-avatar>
          <span style="font-size:11px;color:#666">purple</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Indigo" size="2xl" color="indigo" [includeBorder]="false"></app-ds-avatar>
          <span style="font-size:11px;color:#666">indigo</span>
        </div>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// Initials generation
// ---------------------------------------------------------------------------
export const Initials: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The component shows the **first character** of `fullName` (uppercased). ' +
          'Single-word, double-word, and multi-word names all produce one letter.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="display:flex; gap:24px; padding:16px; flex-wrap:wrap; align-items:flex-end;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Layla" size="2xl" color="emerald" [includeBorder]="true"></app-ds-avatar>
          <span style="font-size:11px;color:#666">"Layla"</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Sara Johnson" size="2xl" color="blue" [includeBorder]="true"></app-ds-avatar>
          <span style="font-size:11px;color:#666">"Sara Johnson"</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <app-ds-avatar fullName="Mohammed Al Hassan Al Rashid" size="2xl" color="teal" [includeBorder]="true"></app-ds-avatar>
          <span style="font-size:11px;color:#666">"Mohammed Al Hassan Al Rashid"</span>
        </div>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// LTR
// ---------------------------------------------------------------------------
export const LTR: Story = {
  parameters: {
    docs: {
      description: { story: 'English name in a left-to-right context.' },
    },
  },
  render: () => ({
    template: `
      <div dir="ltr" style="padding:16px;">
        <app-ds-avatar fullName="John Smith" size="lg" color="blue" [includeBorder]="true"></app-ds-avatar>
      </div>
    `,
  }),
};

// ---------------------------------------------------------------------------
// RTL
// ---------------------------------------------------------------------------
export const RTL: Story = {
  parameters: {
    docs: {
      description: { story: 'Arabic name in a right-to-left context.' },
    },
  },
  render: () => ({
    template: `
      <div dir="rtl" style="padding:16px;">
        <app-ds-avatar fullName="أحمد الراشد" size="lg" color="brand" [includeBorder]="true"></app-ds-avatar>
      </div>
    `,
  }),
};
