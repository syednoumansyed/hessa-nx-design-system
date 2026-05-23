import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { BaseMessage } from '@cometchat/chat-sdk-javascript';
import { IonSpinner } from '@ionic/angular/standalone';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
@Component({
  selector: 'app-image-message',
  templateUrl: './image-message.component.html',
  standalone: true,
  imports: [IonSpinner],
})
export class ImageMessageComponent implements OnInit {
  message = input.required<BaseMessage>();
  private readonly imageSlider = inject(ImageSliderService);

  isLoading = signal(true);
  hasError = signal(false);

  messageUrl = computed(() => {
    return this.message().getData().url;
  });
  constructor() {}

  ngOnInit() {}

  onImageLoad() {
    this.isLoading.set(false);
    this.hasError.set(false);
  }

  onImageError() {
    this.isLoading.set(false);
    this.hasError.set(true);
  }

  onShowImage() {
    const url = this.messageUrl();
    if (url) {
      this.imageSlider.show([url]);
    }
  }
}
