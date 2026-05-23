import { Component, inject, OnInit } from '@angular/core';
import { DsActionListConfig } from '@ds/action-list';
import { DsActionListComponent } from '@ds/action-list/action-list.component';
import { LANGUAGE_LOCAL_STORAGE_KEY } from '@shared/constants/localstorage-keys.constants';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { ModalController } from '@ionic/angular/standalone';
import { faCheck } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-change-language',
  templateUrl: './change-language.component.html',
  styleUrls: ['./change-language.component.scss'],
  imports: [DsActionListComponent],
})
export class ChangeLanguageComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly translocoService = inject(TranslocoService);
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );

  selectedLanguage = localStorage.getItem('lang') || 'en';
  protected readonly faCheck = faCheck;
  config: DsActionListConfig = {
    onItemAction: (item) => {
      this.modalCtrl.dismiss();
      // update the selected language
      if (item.id && this.selectedLanguage !== item.id)
        this.updateLanguage(item.id?.toString());
    },
    title: this.translocoService.translate('global.change_language.txt'),
    items: [
      {
        title: 'English',
        id: 'en',
        endIconConfig: {
          showArrow: this.selectedLanguage === 'en',
          icon: this.faCheck,
          size: 'md',
          disableRtlRotate: true,
        },
      },
      {
        title: 'العربية',
        id: 'ar',
        endIconConfig: {
          showArrow: this.selectedLanguage === 'ar',
          icon: this.faCheck,
          size: 'md',
          disableRtlRotate: true,
        },
      },
    ],
  };

  constructor() {}

  ngOnInit() {}

  updateLanguage(language: string) {
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, language);
    this.schoolStructureScopeService.saveUserSetting$().subscribe({
      next: () => window.location.reload(),
      error: () => window.location.reload(),
    });
  }
}
