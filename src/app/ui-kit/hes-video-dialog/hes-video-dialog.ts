import { ModalController } from '@ionic/angular/standalone';
import { HesVideoDialogComponent } from './hes-video-dialog.component';
import { inject } from '@angular/core';

export function createVideoDialog() {
  const modal = inject(ModalController);
  return ({
    title,
    src,
    onPlay,
  }: {
    title: string;
    src: string | File;
    onPlay?: () => void;
  }) => {
    return openVideoDialog({
      modalCtrl: modal,
      title,
      src,
      onPlay,
    });
  };
}

export async function openVideoDialog({
  modalCtrl,
  title,
  src,
  onPlay,
}: {
  modalCtrl: ModalController;
  title: string;
  src: string | File;
  onPlay?: () => void;
}) {
  const modal = await modalCtrl?.create({
    component: HesVideoDialogComponent,
    componentProps: {
      title,
      src,
      onPlay,
    },
    cssClass: 'full-modal overflow-y-auto',
  });
  modal.present();
  return modal;
}
