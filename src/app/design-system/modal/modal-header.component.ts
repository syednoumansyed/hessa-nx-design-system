import { Component, input, output } from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsButtonComponent } from '@ds/button/button.component';
import {
  faArrowLeft,
  faArrowRight,
  faCircleXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { isRtl } from '@shared/utils/platform';

@Component({
  selector: 'ds-modal-header',
  standalone: true,
  imports: [DsIconComponent, DsButtonComponent],
  template: `
    <div class="flex items-center gap-3">
      @if (showBackButton()) {
        <ds-button
          variant="ghost"
          size="sm"
          [iconStart]="isRtl ? faArrowRight : faArrowLeft"
          (click)="backClick.emit()"
        ></ds-button>
      }

      @if (title()) {
        <div class="min-w-0 flex-1">
          <div
            class="single-line-lg-high-emphasis text-emphasis-high"
            [class.truncate]="!wrapTitle()"
          >
            {{ title() }}
          </div>
          @if (subtitle()) {
            <div class="content-sm-default truncate text-emphasis-mid">
              {{ subtitle() }}
            </div>
          }
        </div>
      } @else if (showCloseButton()) {
        <!-- Spacer to push close button to the right when no title -->
        <div class="flex-1"></div>
      }

      @if (showCloseButton()) {
        <button
          type="button"
          (click)="closeClick.emit()"
          class="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center text-[#B3B3B3] transition-colors hover:text-[#101828]"
          aria-label="Close modal"
        >
          <app-ds-icon [icon]="faCircleXmark" size="2xl" />
        </button>
      }
    </div>
  `,
})
export class DsModalHeaderComponent {
  readonly title = input<string>();
  readonly subtitle = input<string>();
  readonly showBackButton = input<boolean>(false);
  readonly showCloseButton = input<boolean>(true);
  readonly wrapTitle = input<boolean>(false);

  readonly backClick = output<void>();
  readonly closeClick = output<void>();

  protected readonly isRtl = isRtl();
  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faArrowRight = faArrowRight;
  protected readonly faCircleXmark = faCircleXmark;
}
