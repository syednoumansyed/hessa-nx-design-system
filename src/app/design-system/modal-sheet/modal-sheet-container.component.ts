import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { ModalSheetService } from './modal-sheet.service';
import { ModalSheetEntry } from './modal-sheet.types';
import { ModalSheetItemComponent } from './modal-sheet-item.component';
import {
  sheetStateAnimation,
  backdropAnimation,
} from './modal-sheet.animations';

/**
 * Container placed once in app.component.html.
 * Subscribes to the ModalSheetService stack and renders the sheet overlays.
 */
@Component({
  selector: 'ds-modal-sheet-container',
  standalone: true,
  imports: [ModalSheetItemComponent],
  animations: [sheetStateAnimation, backdropAnimation],
  template: `
    @if (isVisible()) {
      <div
        class="ds-modal-sheet-overlay"
        [@backdrop]="backdropState()"
        (click)="onBackdropClick()"
      ></div>
    }

    @for (entry of entries(); track entry.id; let i = $index) {
      <div
        class="ds-modal-sheet-wrapper"
        [class.ds-modal-sheet-pointer-none]="entry.state !== 'active'"
        [style.z-index]="9999 + i"
        [@sheetState]="entry.state"
      >
        <ds-modal-sheet-item [entry]="entry" />
      </div>
    }
  `,
  styleUrl: './modal-sheet-container.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ModalSheetContainerComponent {
  private readonly sheetService = inject(ModalSheetService);
  private readonly platform = inject(Platform);
  private readonly destroyRef = inject(DestroyRef);

  private backButtonSub: Subscription | null = null;

  readonly entries = this.sheetService.stack;
  readonly isVisible = computed(() => this.entries().length > 0);
  readonly backdropState = computed(() =>
    this.entries().length > 0 ? 'visible' : 'hidden',
  );

  constructor() {
    effect(() => {
      this.manageBackButton(this.entries().length > 0);
    });

    this.destroyRef.onDestroy(() => {
      this.backButtonSub?.unsubscribe();
    });
  }

  onBackdropClick(): void {
    const entries = this.entries();
    if (entries.length === 0) return;
    const topEntry = entries[entries.length - 1];
    if (topEntry.config.backdropDismiss) {
      topEntry.dismissFn(undefined, 'backdrop');
    }
  }

  private manageBackButton(hasSheets: boolean): void {
    if (hasSheets && !this.backButtonSub) {
      this.backButtonSub = this.platform.backButton.subscribeWithPriority(
        300,
        () => {
          this.sheetService.dismissTop(undefined, 'back');
        },
      );
    } else if (!hasSheets && this.backButtonSub) {
      this.backButtonSub.unsubscribe();
      this.backButtonSub = null;
    }
  }
}
