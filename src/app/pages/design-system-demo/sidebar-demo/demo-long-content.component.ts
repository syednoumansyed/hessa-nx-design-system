import { Component, input } from '@angular/core';

/**
 * Long-content sample used to exercise the bottom sheet / modal sheet height
 * bounds (min 25vh, max 90vh). Renders enough paragraphs to overflow the
 * content area so scrolling kicks in and the sheet caps at max-height.
 */
@Component({
  selector: 'app-demo-long-content',
  standalone: true,
  template: `
    <div class="flex flex-col gap-4">
      <p class="text-emphasis-high">
        This sheet contains a long body so you can verify:
      </p>
      <ul class="list-inside list-disc text-emphasis-mid">
        <li>Sheet never taller than 90vh (backdrop visible at top)</li>
        <li>Content scrolls inside the sheet, not the page</li>
        <li>Header and footer stay sticky while content scrolls</li>
      </ul>

      @for (section of sections; track $index) {
        <div class="rounded-ds-md border border-stroke-cool-black-04 p-4">
          <h4 class="heading-h4-high-emphasis mb-2">
            Section {{ $index + 1 }}: {{ section.title }}
          </h4>
          <p class="text-emphasis-mid">{{ section.body }}</p>
        </div>
      }

      <p class="text-emphasis-mid">
        If you can see this paragraph only by scrolling inside the sheet, the
        max-height cap is working. If you had to scroll the page behind the
        sheet, the cap is off.
      </p>
    </div>
  `,
})
export class DemoLongContentComponent {
  closeModal!: (data?: unknown, role?: string) => void;
  readonly message = input<string>();

  protected readonly sections = [
    {
      title: 'Lorem ipsum',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    },
    {
      title: 'Duis aute irure',
      body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    },
    {
      title: 'Sed ut perspiciatis',
      body: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    },
    {
      title: 'Nemo enim',
      body: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',
    },
    {
      title: 'At vero eos',
      body: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
    },
    {
      title: 'Temporibus autem',
      body: 'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.',
    },
    {
      title: 'Ut aut reiciendis',
      body: 'Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. On the other hand, we denounce with righteous indignation and dislike men who are so beguiled.',
    },
    {
      title: 'Quis autem vel',
      body: 'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur at vero eos et accusamus.',
    },
    {
      title: 'Finis scrollus',
      body: 'If this is the last section you see after scrolling inside the sheet, the scroll works correctly. The footer buttons should have stayed pinned to the bottom throughout.',
    },
  ];

  onPrimaryClick(): void {
    this.closeModal({ action: 'primary' }, 'confirm');
  }

  onSecondaryClick(): void {
    this.closeModal({ action: 'secondary' }, 'cancel');
  }
}

/**
 * Tiny-content sample used to exercise the bottom sheet / modal sheet min-height
 * floor (25vh). Renders only a one-liner so the sheet would naturally be much
 * shorter — if the min-height is working, the sheet still takes at least 25vh.
 */
@Component({
  selector: 'app-demo-tiny-content',
  standalone: true,
  template: `
    <p class="text-emphasis-high">
      Tiny content. If the sheet is still ~25% of the viewport tall with empty
      space below this line, the min-height floor is working.
    </p>
  `,
})
export class DemoTinyContentComponent {
  closeModal!: (data?: unknown, role?: string) => void;

  onPrimaryClick(): void {
    this.closeModal(undefined, 'confirm');
  }
}
