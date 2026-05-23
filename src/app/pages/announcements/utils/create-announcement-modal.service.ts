import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { CreateAnnouncementComponent } from '../components/create-announcement/create-announcement.component';

@Injectable({
  providedIn: 'root',
})
export class CreateAnnouncementModalService {
  private readonly modalCtrl = inject(ModalController);

  async showCreateAnnouncementModal() {
    let modal = await this.modalCtrl?.create({
      component: CreateAnnouncementComponent,
    });
    await modal?.present();
    const result = await modal?.onDidDismiss();
    return result;
  }
}
