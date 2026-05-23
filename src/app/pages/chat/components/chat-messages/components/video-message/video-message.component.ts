import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { BaseMessage } from '@cometchat/chat-sdk-javascript';
import { faPlayCircle, faVideo } from '@fortawesome/pro-regular-svg-icons';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { FaIconComponentsProps } from '@shared/types';

@Component({
  selector: 'app-video-message',
  templateUrl: './video-message.component.html',
  standalone: true,
  imports: [HesIconComponent],
  exportAs: 'videMessage',
})
export class VideoMessageComponent implements OnInit, AfterViewInit {
  message = input.required<BaseMessage>();
  messageUrl = computed(() => {
    return this.message().getData().url;
  });
  isShowPlayButton = signal<boolean>(true);
  videoPlayer = viewChild<ElementRef<HTMLVideoElement>>('videoPlayerRef');
  readonly faPlayIcon: FaIconComponentsProps = {
    icon: faPlayCircle,
    size: '2x',
  };
  readonly faVideoIcon: FaIconComponentsProps = {
    icon: faVideo,
    size: 'sm',
  };
  durantion = signal<string>('');
  constructor() {}
  ngAfterViewInit(): void {
    this.getVideoRef()?.addEventListener(
      'loadedmetadata',
      () => {
        const duration = this.getVideoRef()?.duration;
        if (duration) {
          const minutes = Math.floor(duration / 60);
          const seconds = Math.floor(duration % 60);
          this.durantion.set(
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          );
        }
      },
      { once: true },
    );
  }

  ngOnInit() {}

  onPlay() {
    const videRef = this.getVideoRef();
    if (videRef) {
      videRef.play();
      this.hidePlayButton();
      this.showControls();
      this.isShowPlayButton.set(false);
    }
  }
  showPlayButton() {
    this.isShowPlayButton.set(true);
    this.hideControls();
  }

  private hidePlayButton() {
    this.isShowPlayButton.set(false);
  }

  private hideControls() {
    const videRef = this.getVideoRef();
    if (videRef) videRef.controls = false;
  }

  private showControls() {
    const videRef = this.getVideoRef();
    if (videRef) videRef.controls = true;
  }
  private getVideoRef() {
    return this.videoPlayer()?.nativeElement;
  }
}
