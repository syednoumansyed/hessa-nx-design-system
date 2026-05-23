import { Component, inject, Input, OnInit } from '@angular/core';
import { YouTubePlayer } from '@angular/youtube-player';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { faXmark } from '@fortawesome/pro-light-svg-icons';
import { FaIconComponentsProps } from '@shared/types';
import { TranslocoService } from '@jsverse/transloco';
import { Capacitor } from '@capacitor/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// SPIKE: Temporary hosted URL - replace with production URL later
const HOSTED_PLAYER_URL =
  'https://api.dev.ncle.dev/api/v2/public/proxies/youtube';

@Component({
  selector: 'app-youtube-player',
  styleUrl: './youtube-player.component.scss',
  templateUrl: './youtube-player.component.html',
  imports: [YouTubePlayer, HesIconComponent, CommonModule],
  standalone: true,
})
export class YoutubePlayerComponent implements OnInit {
  private readonly transLoco = inject(TranslocoService);
  private readonly sanitizer = inject(DomSanitizer);

  @Input() videoId: string;
  @Input() title: string;
  @Input() close: () => void;
  @Input() onPlay?: () => void;

  playerConfig = {
    autoplay: 1,
    rel: 0,
    hl: this.transLoco.getActiveLang(),
  };

  // Track if we're using iOS native - use iframe proxy instead of Angular YouTube player
  isIosNative = false;

  // Safe iframe URL for iOS
  iframeUrl: SafeResourceUrl | null = null;

  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'xl',
  };

  ngOnInit() {
    // Check if running on iOS native
    this.isIosNative =
      Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

    if (this.isIosNative) {
      this.buildIframeUrl();
    }
  }

  /**
   * Builds the iframe URL for iOS native platform.
   * Uses a hosted proxy page with https:// origin to bypass capacitor:// restriction.
   */
  private buildIframeUrl() {
    const lang = this.transLoco.getActiveLang();

    // Build URL - hosted page renders only the YouTube player, no extra UI
    const url = `${HOSTED_PLAYER_URL}?v=${this.videoId}&lang=${lang}&autoplay=true`;

    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    // Trigger onPlay callback after delay for autoplay
    if (this.onPlay) {
      setTimeout(() => {
        this.onPlay?.();
      }, 2000);
    }
  }

  onPlayerStateChange(event: any): void {
    // YT.PlayerState.PLAYING = 1
    if (event.data === 1 && this.onPlay) {
      this.onPlay();
    }
  }
}
