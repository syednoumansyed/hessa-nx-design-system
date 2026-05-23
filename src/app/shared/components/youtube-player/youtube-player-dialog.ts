import { ModalController } from '@ionic/angular/standalone';
import { YoutubePlayerComponent } from '@shared/components/youtube-player/youtube-player.component';
import { youtubeUrlToId } from '@pages/vcr/pages/utils';
import { inject } from '@angular/core';

export function createYoutubePlayerDialog() {
  const modalCtrl = inject(ModalController);
  return async function (title: string, url: string, onPlay?: () => void) {
    const modal = await modalCtrl?.create({
      component: YoutubePlayerComponent,
      componentProps: {
        close: () => modal.dismiss(),
        videoId: url.startsWith('http') ? youtubeUrlToId(url) : url, // it's id not url
        title,
        onPlay,
      },
      cssClass: 'xxl-modal overflow-y-auto transparent-modal yt-modal',
      backdropDismiss: false,
    });
    await modal.present();
    return modal;
  };
}
