import {
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonSkeletonText } from '@ionic/angular/standalone';
import {
  SupportHubDetailHeaderComponent,
  type SupportHubDetailHeaderConfig,
} from '../detail-header/support-hub-detail-header.component';
import { SupportTicketSchoolInfoComponent } from './support-ticket-school-info.component';
import { SupportTicketDetailScrollHeaderComponent } from './support-ticket-detail-scroll-header.component';
import { SupportTicketCardConfig } from '../ticket-card/support-ticket-card.component';
import { SupportHubTicketDetail } from '@pages/support-hub/data-access/support-hub-ticket-detail.interface';
import { PopupItem } from '@ds/popup/types/popup.interface';

@Component({
  selector: 'app-support-ticket-detail-layout',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonSkeletonText,
    SupportHubDetailHeaderComponent,
    SupportTicketSchoolInfoComponent,
    SupportTicketDetailScrollHeaderComponent,
  ],
  templateUrl: './support-ticket-detail-layout.component.html',
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class SupportTicketDetailLayoutComponent {
  // Inputs
  readonly headerConfig = input<SupportHubDetailHeaderConfig | null>(null);
  readonly schoolInfo = input<SupportTicketCardConfig['school'] | null>(null);
  readonly showSchoolInfo = input<boolean>(false);
  readonly summary = input<SupportTicketCardConfig | null>(null);
  readonly detail = input<SupportHubTicketDetail | null>(null);
  readonly contentStages = input<unknown[]>([]);
  readonly isLoading = input<boolean>(false);
  readonly hasFooter = input<boolean>(false);

  // Outputs
  readonly back = output<void>();
  readonly viewProfile = output<void>();
  readonly scrollHeaderMenuItemSelected = output<PopupItem>();

  // Internal state
  private readonly scrollHeaderVisible = signal(false);
  protected readonly showScrollHeader = computed(() =>
    this.scrollHeaderVisible(),
  );

  protected readonly skeletonStages: ReadonlyArray<DetailSkeletonStageConfig> =
    [
      {
        id: 'summary',
        avatar: 'h-12 w-12 rounded-ds-full',
        headerLines: ['h-5 w-48', 'h-4 w-40'],
        trailing: null,
        bodyLines: ['h-4 w-full', 'h-4 w-3/4'],
        footerBadges: ['h-6 w-28 rounded-ds-2xl'],
        attachments: [],
      },
      {
        id: 'activity',
        avatar: 'h-10 w-10 rounded-ds-full',
        headerLines: ['h-4 w-32'],
        trailing: null,
        bodyLines: ['h-4 w-2/3', 'h-4 w-1/2'],
        footerBadges: [],
        attachments: [],
      },
    ];

  protected readonly scrollContainerRef =
    viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  get scrollContainer(): HTMLDivElement | null {
    return this.scrollContainerRef()?.nativeElement ?? null;
  }

  private previousStagesLength = 0;
  private initialScrollDone = false;

  constructor() {
    // Auto-scroll to end when content changes
    effect(() => {
      const stages = this.contentStages();
      const isLoading = this.isLoading();
      const container = this.scrollContainerRef()?.nativeElement;

      if (!stages.length || isLoading || !container) {
        return;
      }

      const isInitialLoad = !this.initialScrollDone;
      const hasNewStages = stages.length > this.previousStagesLength;
      this.previousStagesLength = stages.length;

      if (isInitialLoad || hasNewStages) {
        this.initialScrollDone = true;
        // Use multiple delayed scrolls to handle images and async content
        this.performDelayedScroll(container);
      }
    });
  }

  /**
   * Performs scroll to bottom with multiple attempts to handle async content loading
   */
  private performDelayedScroll(container: HTMLElement): void {
    // Immediate scroll for visible content
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });

    // Second scroll after short delay for content that renders quickly
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 150);

    // Third scroll after longer delay for images and heavier content
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 400);
  }

  @HostListener('scroll', ['$event'])
  protected onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    const scrollTop = target.scrollTop;
    const threshold = 300;
    this.scrollHeaderVisible.set(scrollTop > threshold);
  }

  protected onBackRequested(): void {
    this.back.emit();
  }

  protected onViewProfileRequested(): void {
    this.viewProfile.emit();
  }

  protected onScrollHeaderClick(): void {
    const container = this.scrollContainerRef()?.nativeElement;
    if (!container) return;

    container.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected onScrollHeaderMenuItemSelected(item: PopupItem): void {
    this.scrollHeaderMenuItemSelected.emit(item);
  }

  /**
   * Public method to scroll to the end of the container
   */
  scrollToEnd(): void {
    const container = this.scrollContainerRef()?.nativeElement;
    if (!container) return;

    this.performDelayedScroll(container);
  }

  /**
   * Public method to scroll to the top of the container
   */
  scrollToTop(): void {
    const container = this.scrollContainerRef()?.nativeElement;
    if (!container) return;

    container.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

type DetailSkeletonStageConfig = {
  readonly id: string;
  readonly avatar: string;
  readonly headerLines: ReadonlyArray<string>;
  readonly trailing: string | null;
  readonly bodyLines: ReadonlyArray<string>;
  readonly footerBadges: ReadonlyArray<string>;
  readonly attachments: ReadonlyArray<string>;
};
