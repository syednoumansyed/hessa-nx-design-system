import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { HesImageSliderComponent } from './hes-image-slider.component';
@Injectable({
  providedIn: 'root',
})
export class ImageSliderService {
  private readonly modalControler = inject(ModalController);
  constructor() {}

  async show(imagesUrl: Array<string>, initIndex = 0) {
    const modal = await this.modalControler.create({
      component: HesImageSliderComponent,
      componentProps: { imagesUrl, initIndex },
      cssClass: 'image-slider',
      backdropDismiss: false,
      showBackdrop: false,
    });

    modal.present();
  }
}
