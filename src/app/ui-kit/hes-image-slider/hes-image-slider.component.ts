import { CommonModule } from '@angular/common';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faAngleLeft,
  faArrowLeft,
  faArrowRight,
  faClose,
} from '@fortawesome/pro-regular-svg-icons';
import {
  IonButton,
  IonImg,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButtons,
  ModalController,
} from '@ionic/angular/standalone';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { HesFileService } from '@shared/services/hes-file.service';
import { FaIconComponentsProps } from '@shared/types/icons';
import { isMobile } from '@shared/utils/platform';
@Component({
  selector: 'app-hes-image-slider',
  templateUrl: './hes-image-slider.component.html',
  styleUrl: './hes-image-slider.component.scss',
  standalone: true,
  imports: [
    IonButtons,
    CommonModule,
    IonButton,
    FontAwesomeModule,
    HesIconComponent,
    IonImg,
    IonHeader,
    IonToolbar,
    IonContent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HesImageSliderComponent implements OnInit {
  @ViewChild(IonContent) content: IonContent;
  @ViewChild('swiper')
  swiperRef: ElementRef | undefined;
  imagesRef = viewChildren(IonImg, { read: ElementRef });
  loadedImagesCount = signal(0);

  @Input() imagesUrl: Array<string>;
  @Input() set initIndex(value: number) {
    this.selectedDisplayImageIndex.set(value);
  }

  readonly arrowLeft: FaIconComponentsProps = {
    icon: faArrowLeft,
  };
  readonly arrowRight: FaIconComponentsProps = {
    icon: faArrowRight,
  };

  readonly angleLeft: FaIconComponentsProps = {
    icon: faAngleLeft,
  };

  readonly closeIcon: FaIconComponentsProps = {
    icon: faClose,
  };
  readonly selectedDisplayImageIndex = signal<number>(0);
  readonly displayImage = computed(() => {
    const idx = this.selectedDisplayImageIndex();
    return this.imagesUrl[idx];
  });
  readonly isMobile = isMobile();
  private readonly modalControler = inject(ModalController);
  private readonly fileService = inject(HesFileService);
  readonly selectedSingalImageIndex = signal<number | null>(null);
  @HostBinding('class.desktop-image-preview') get isDesktop() {
    return !this.isMobile;
  }
  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    this.onClose();
  }

  @HostListener('document:keydown.arrowleft')
  handleLeftArrowKey() {
    this.onLeft();
  }

  @HostListener('document:keydown.arrowright')
  handleRightArrowKey() {
    this.onRight();
  }

  constructor() {
    if (isMobile()) {
      effect(() => {
        // only for mobile devices
        const refs = this.imagesRef();
        const loadedImagesCount = this.loadedImagesCount();
        if (
          refs.length === this.imagesUrl.length &&
          // check that the image sloaded count is the same as the number of images preloaded in the thumbnail or preview component
          // as those images are the only one that can be scrolled to as the other image are lazy loaded using ion-img component
          // but those images are cached already in the browser
          loadedImagesCount === this.imagesUrl.slice(0, 2).length + 1
        ) {
          this.scrollToImage(this.selectedDisplayImageIndex());
        }
      });
    }
  }

  ngOnInit() {
    if (this.imagesUrl.length === 1) {
      this.selectedSingalImageIndex.set(0);
    }
  }

  imageLoaded() {
    this.loadedImagesCount.update((val) => val + 1);
  }

  async scrollToImage(index: number) {
    // only for mobile devices
    const imgElement = this.imagesRef()[index];
    if (imgElement) {
      const scrollElement = await this.content.getScrollElement();
      const position = imgElement.nativeElement.getBoundingClientRect();
      const scrollElementTop = scrollElement.getBoundingClientRect().top;
      // Adjust the scrollToPoint call to use the scrollElement's scrollTop
      const scrollPosition =
        position.top + scrollElement.scrollTop - scrollElementTop;
      this.content.scrollToPoint(0, scrollPosition, 300);
    }
  }

  onLeft() {
    const currentIndex = this.selectedDisplayImageIndex();
    if (currentIndex > 0) {
      this.selectedDisplayImageIndex.update((value) => value - 1);
    }
  }

  onRight() {
    const currentIndex = this.selectedDisplayImageIndex();
    if (currentIndex < this.imagesUrl.length - 1)
      this.selectedDisplayImageIndex.update((value) => value + 1);
  }

  onClose() {
    if (this.selectedSingalImageIndex() != null && this.imagesUrl.length > 1) {
      this.selectedSingalImageIndex.set(null);
    } else {
      this.modalControler.dismiss();
    }
  }

  onSelectImage(idx: number) {
    this.selectedSingalImageIndex.set(idx);
    setTimeout(() => {
      this.swiperRef?.nativeElement.swiper.slideTo(idx);
    });
  }

  onSave() {
    const activeIndex = this.swiperRef?.nativeElement.swiper.activeIndex;
    this.fileService.downloadFile({
      url: this.imagesUrl[activeIndex],
    });
  }
}
