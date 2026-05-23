import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { Router, RouterOutlet } from '@angular/router';
import { isMobile } from '@shared/utils/platform';
import { TranslocoService } from '@jsverse/transloco';
import { LANGUAGE_LOCAL_STORAGE_KEY } from '@shared/constants/localstorage-keys.constants';

@Component({
  selector: 'app-login-old',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    RouterOutlet,
    IonSelect,
    IonSelectOption,
  ],
})
export class LoginPage {
  private readonly router = inject(Router);
  protected transloco = inject(TranslocoService);
  isMobile = isMobile();
  selectedLanguage = this.transloco.getActiveLang();

  ionViewWillEnter() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('chatAuthToken');
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  onLanguageChange(event: any) {
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, event.detail.value);
    window.location.reload();
  }
}
