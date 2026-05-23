import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DsAttachmentControlValue } from './attachment-control-value.interface';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { DsImageGalleryItemComponent } from './ds-image-gallery-item.component';

interface DsImagePreviewItem {
  readonly index: number;
  readonly url: string;
}

@Component({
  selector: 'ds-image-gallery',
  standalone: true,
  imports: [CommonModule, DsImageGalleryItemComponent],
  host: {
    class: 'block w-full max-w-[22.5rem]',
  },
  template: `
    @if (hasImages()) {
      @if (imageCount() === 1) {
        <ds-image-gallery-item
          [tileClass]="singleTileClasses()"
          [url]="previewItems()[0]!.url"
          [alt]="singleImageAlt()"
          (selected)="onImageClick(0)"
        ></ds-image-gallery-item>
      } @else if (imageCount() === 2) {
        <div class="{{ twoImageContainerClasses() }}">
          @for (
            item of previewItems().slice(0, 2);
            track item.index;
            let previewIndex = $index
          ) {
            <ds-image-gallery-item
              [tileClass]="tileClasses()"
              [url]="item.url"
              [alt]="multiImageAlt(previewIndex)"
              (selected)="onImageClick(previewIndex)"
            ></ds-image-gallery-item>
          }
        </div>
      } @else if (imageCount() === 3) {
        <div class="{{ threeImageContainerClasses() }}">
          <ds-image-gallery-item
            [tileClass]="tileClasses() + ' row-span-2'"
            [url]="previewItems()[0]!.url"
            [alt]="multiImageAlt(0)"
            (selected)="onImageClick(0)"
          ></ds-image-gallery-item>
          @for (
            item of previewItems().slice(1, 3);
            track item.index;
            let offset = $index
          ) {
            <ds-image-gallery-item
              [tileClass]="tileClasses()"
              [url]="item.url"
              [alt]="multiImageAlt(offset + 1)"
              (selected)="onImageClick(offset + 1)"
            ></ds-image-gallery-item>
          }
        </div>
      } @else {
        <div class="{{ fourPlusContainerClasses() }}">
          @for (
            item of previewItems().slice(0, 3);
            track item.index;
            let previewIndex = $index
          ) {
            <ds-image-gallery-item
              [tileClass]="tileClasses()"
              [url]="item.url"
              [alt]="multiImageAlt(previewIndex)"
              (selected)="onImageClick(previewIndex)"
            ></ds-image-gallery-item>
          }
          <div class="{{ tileClasses() }}">
            <ds-image-gallery-item
              [tileClass]="'absolute inset-0'"
              [url]="previewItems()[3]!.url"
              [alt]="multiImageAlt(3)"
              (selected)="onImageClick(3)"
            ></ds-image-gallery-item>
            @if (overflowCount() > 0) {
              <div
                class="absolute inset-0 flex items-center justify-center rounded-ds-xl bg-black-0/60"
                (click)="onImageClick(3)"
              >
                <span
                  class="heading-h3-high-emphasis text-white drop-shadow-lg"
                >
                  +{{ overflowCount() }}
                </span>
              </div>
            }
          </div>
        </div>
      }
    }
  `,
})
export class DsImageGalleryComponent {
  attachments = input<DsAttachmentControlValue[]>([]);
  containerClass = input<string>('');
  imageSelected = output<number>();

  private readonly previewItemsInternal = signal<DsImagePreviewItem[]>([]);
  private previewRequestId = 0;
  private readonly imageSlider = inject(ImageSliderService);

  protected readonly previewItems = computed(() => this.previewItemsInternal());
  protected readonly imageCount = computed(() => this.previewItems().length);
  protected readonly hasImages = computed(() => this.imageCount() > 0);
  protected readonly overflowCount = computed(() =>
    Math.max(this.imageCount() - 4, 0),
  );
  protected readonly previewUrls = computed(() =>
    this.previewItems().map((item) => item.url),
  );

  protected readonly singleTileClasses = computed(() =>
    this.mergeClasses(
      'relative aspect-square cursor-pointer overflow-hidden rounded-ds-xl w-full max-w-[10.5rem]',
      this.containerClass(),
    ),
  );

  protected readonly tileClasses = computed(
    () =>
      'relative aspect-square cursor-pointer overflow-hidden rounded-ds-xl w-full',
  );

  protected readonly twoImageContainerClasses = computed(() =>
    this.mergeClasses(
      'grid grid-cols-2 gap-2 w-full max-w-none justify-items-stretch',
      this.containerClass(),
    ),
  );

  protected readonly threeImageContainerClasses = computed(() =>
    this.mergeClasses(
      'grid grid-cols-2 gap-2 w-full max-w-none justify-items-stretch',
      this.containerClass(),
    ),
  );

  protected readonly fourPlusContainerClasses = computed(() =>
    this.mergeClasses(
      'grid grid-cols-2 grid-rows-2 gap-2 w-full max-w-none justify-items-stretch',
      this.containerClass(),
    ),
  );

  constructor() {
    effect(
      () => {
        void this.resolvePreviewUrls(this.attachments());
      },
      { allowSignalWrites: true },
    );
  }

  protected onImageClick(previewIndex: number): void {
    const urls = this.previewUrls();
    if (!urls.length) {
      return;
    }

    const clampedIndex = Math.min(Math.max(previewIndex, 0), urls.length - 1);

    void this.imageSlider.show(urls, clampedIndex);

    const items = this.previewItems();
    const originalIndex = items[clampedIndex]?.index ?? clampedIndex;
    this.imageSelected.emit(originalIndex);
  }

  protected singleImageAlt(): string {
    return 'Image preview';
  }

  protected multiImageAlt(index: number): string {
    return `Image preview ${index + 1}`;
  }

  private mergeClasses(base: string, extra: string): string {
    return extra ? `${base} ${extra}`.trim() : base;
  }

  private async resolvePreviewUrls(
    attachments: DsAttachmentControlValue[],
  ): Promise<void> {
    const requestId = ++this.previewRequestId;
    const previews = await Promise.all(
      attachments.map(async (attachment, index) => {
        const url = await this.extractUrl(attachment);
        if (!url) {
          return null;
        }
        return { index, url } satisfies DsImagePreviewItem;
      }),
    );

    if (requestId !== this.previewRequestId) {
      return;
    }

    this.previewItemsInternal.set(
      previews.filter((item): item is DsImagePreviewItem => item !== null),
    );
  }

  private async extractUrl(
    attachment: DsAttachmentControlValue,
  ): Promise<string | null> {
    if (attachment instanceof File) {
      return this.readFileAsDataUrl(attachment);
    }

    return attachment.url ?? null;
  }

  private readFileAsDataUrl(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }
}
