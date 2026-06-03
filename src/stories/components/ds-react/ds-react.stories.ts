import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import { OverlayModule } from '@angular/cdk/overlay';
import { ReactionsComponent } from '@ds/react/react.component';
import { AuthService } from '@auth/auth.service';
import { DsModalService } from '@ds/modal';
import {
  ReactionData,
  ReactionType,
  ReactionUser,
} from '@ds/react/types/react.types';
import { UserType } from '@shared/enums';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';

// Mock services needed by the Reactions component
const mockAuthService = {
  isUserPersonnel: () => true,
};

const mockDsModalService = {
  open: async () => ({
    onDismiss: async () => ({ role: 'close' }),
  }),
};

/**
 * # Reactions — `ds-react`
 *
 * A social interaction component allowing users to click and see comment/post reactions.
 * - On **Desktop**: Hovering over reaction chips shows a list tooltip of users who reacted.
 * - On **Mobile**: Clicking toggles reactions; long pressing opens a detail bottom sheet.
 *
 * Uses CDK Overlay internally to float reaction selectors.
 */
const meta: Meta<ReactionsComponent> = {
  title: '1. P0 Components/Reactions',
  component: ReactionsComponent,
  tags: ['autodocs'],
  decorators: [
    withHessaProviders({ ionic: true, translocoTesting: true }),
    moduleMetadata({
      imports: [ReactionsComponent, OverlayModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: DsModalService, useValue: mockDsModalService },
      ],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div class="p-ds-2xl max-w-[480px] bg-surface-primary rounded-ds-xl border border-neutral-cool-300 min-h-[220px]">${story}</div>`,
    ),
  ],
  argTypes: {
    reactions: {
      control: 'object',
      description:
        'Reaction count list with counts, icons, selection states, and user details.',
    },
  },
};

export default meta;
type Story = StoryObj<ReactionsComponent>;

const mockUsers: ReactionUser[] = [
  {
    id: 101,
    arFullName: 'أحمد الراشد',
    enFullName: 'Ahmed Al-Rashid',
    preferredName: 'Ahmed',
    profileColor: 'brand',
    imageUrl: null,
    userType: UserType.PERSONNEL,
    roles: [],
  },
  {
    id: 102,
    arFullName: 'سارة المنصوري',
    enFullName: 'Sara Al-Mansouri',
    preferredName: 'Sara',
    profileColor: 'emerald',
    imageUrl: null,
    userType: UserType.PERSONNEL,
    roles: [],
  },
];

const mockReactions: ReactionData[] = [
  { type: ReactionType.LIKE, count: 12, isReacted: true, users: mockUsers },
  {
    type: ReactionType.HEART,
    count: 5,
    isReacted: false,
    users: [mockUsers[0]],
  },
];

// ─── Default ─────────────────────────────────────────────────────────────────
export const Default: Story = {
  name: 'Default (Personnel User)',
  args: {
    reactions: mockReactions,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify main chips are rendered
    const likeChip = canvas.getByText('12');
    await expect(likeChip).toBeInTheDocument();

    // Find the react button
    const reactBtn = canvas.getByRole('button', { name: /feed.button.react/i });
    await expect(reactBtn).toBeInTheDocument();

    // Click the react trigger button
    await userEvent.click(reactBtn);

    // Check if the overlay selector appears (CDK overlay container will contain the selector buttons)
    // Locate standard cdk-overlay container in body or selector buttons in container
    const body = within(document.body);
    const likeEmoji = body.getByTitle('announcement.emotion.like');
    await expect(likeEmoji).toBeInTheDocument();

    // Click the Like emoji inside overlay
    await userEvent.click(likeEmoji);
  },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────
export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    reactions: mockReactions,
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr">${story}</div>`,
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────
export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    reactions: [
      {
        type: ReactionType.LIKE,
        count: 4,
        isReacted: false,
        users: [mockUsers[0]],
      },
      {
        type: ReactionType.CLAP,
        count: 8,
        isReacted: true,
        users: [mockUsers[1]],
      },
    ],
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
