import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
type HesTranslateParam = string;
type HashMap = { [key: string]: any };
@Injectable({
  providedIn: 'root',
})
export class HesTranslateService {
  private transloco = inject(TranslocoService);

  getActiveLang() {
    return this.transloco.getActiveLang();
  }

  t(key: HesTranslateParam, params?: HashMap, lang?: string): string {
    return this.transloco.translate(key, params, lang);
  }

  translate(key: HesTranslateParam, params?: HashMap, lang?: string): string {
    return this.t(key, params, lang);
  }

  enumT(key: HesTranslateParam, params?: HashMap, lang?: string): string {
    return this.transloco.translate('enum.' + key?.toUpperCase(), params, lang);
  }

  get globalTObj() {
    return {
      delete: this.t('global.delete.btn'),
      cancel: this.t('global.cancel.btn'),
      edit: this.t('global.edit.btn'),
      view: this.t('global.view.btn'),
      save: this.t('global.save.btn'),
      add: this.t('global.add.btn'),
      close: this.t('global.close.btn'),
      yes: this.t('global.yes.btn'),
      no: this.t('global.no.btn'),
      update: this.t('global.update.btn'),
      create: this.t('global.create.btn'),
      deleteConfirm: this.t('global.delete_confirm.btn'),
      none: this.t('global.none.txt'),
      you: this.t('global.you.txt'),
      className: (classNumber: number) => {
        return `${this.t('global.class.title')} ${classNumber}`;
      },
    };
  }
}
