import { DOCUMENT } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslocoService } from '@jsverse/transloco';
import { LANGUAGE_LOCAL_STORAGE_KEY } from '@shared/constants/localstorage-keys.constants';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  standalone: true,
})
export class AppComponent implements OnInit {
  private translocoService = inject(TranslocoService);
  private document = inject(DOCUMENT);

  constructor() {}
  ngOnInit(): void {
    this.translocoService.langChanges$.subscribe((lang) => {
      this.document.documentElement.lang = lang;
      this.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
    const lang = localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY) ?? 'ar';
    this.translocoService.setActiveLang(lang);
    this.document.documentElement.lang = lang;
    this.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
