import {
  EnvironmentProviders,
  importProvidersFrom,
  Provider,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  provideAnimations,
  provideNoopAnimations,
} from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { Platform, provideIonicAngular } from '@ionic/angular/standalone';
import { provideToastr, ToastrService } from 'ngx-toastr';
import { provideLottieOptions } from 'ngx-lottie';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { TuiErrorModule, TuiRootModule } from '@taiga-ui/core';
import { TUI_DATE_FORMAT } from '@taiga-ui/cdk';
import { TUI_CANCEL_WORD, TUI_DONE_WORD } from '@taiga-ui/kit';
import { of } from 'rxjs';
import { applicationConfig } from '@storybook/angular';
import {
  DS_TRANSLATION_TOKEN,
  DsTranslationService,
} from '@ds/i18n/ds-translation.token';
import { DsToastComponent } from '@ds/toast/ds-toast.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { LayoutService } from '@layout/layout.service';
import { DsFileInteractionService } from '@ds/utils/ds-file-interaction.service';

type HessaLocale = 'en' | 'ar';
type HessaAnimations = 'noop' | 'browser' | false;
type HessaToaster = 'mock' | 'real' | false;
type HessaFileInteractions = 'mock' | false;

export interface HessaProvidersOptions {
  ionic?: boolean;
  animations?: HessaAnimations;
  http?: boolean;
  locale?: HessaLocale;
  translations?: boolean | Record<string, string>;
  toaster?: HessaToaster;
  fileInteractions?: HessaFileInteractions;
  mobile?: boolean;
  layout?: boolean;
  taiga?: boolean;
  lottie?: boolean;
  translocoTesting?: boolean;
}

const DEFAULT_TRANSLATIONS: Record<string, string> = {
  'global.add.btn': 'Add',
  'global.cancel.btn': 'Cancel',
  'global.clear.btn': 'Clear',
  'global.close.btn': 'Close',
  'global.create.btn': 'Create',
  'global.customize_columns.title': 'Customize columns',
  'global.delete.btn': 'Delete',
  'global.delete_confirm.btn': 'Delete',
  'global.edit.btn': 'Edit',
  'global.no.btn': 'No',
  'global.none.txt': 'None',
  'global.ok.btn': 'OK',
  'global.per_page.txt': 'per page',
  'global.save.btn': 'Save',
  'global.select.btn': 'Select',
  'global.select_all.txt': 'Select all',
  'global.select_items_to.txt': 'Select to',
  'global.selected.txt': 'selected',
  'global.update.btn': 'Update',
  'global.view.btn': 'View',
  'global.yes.btn': 'Yes',
  'global.you.txt': 'You',
  'global.all.txt': 'All',
  'global.all_students.title': 'All Students',
  'global.class.title': 'Class',
  'global.click_to_upload.btn': 'Click to upload',
  'global.drag_drop.txt': 'or drag and drop',
  'global.apply.btn': 'Apply',
  'global.apply.txt': 'Apply',
  'global.clear_filters.btn': 'Clear filters',
  'global.filters.title': 'Filters',
  'global.picker_select.items_selected':
    '{{count}} {{itemLabel}} selected',
  'global.picker_select.select_title': 'Select {{itemLabel}}',
  'global.multiple_attachment_upload.info':
    'Drag and drop or click here to upload files ({{types}} up to {{size}}GB)',
  'global.single_attachment_upload.info':
    'Drag and drop or click here to upload a file ({{types}} up to {{size}}GB)',
  'global.attachment.max_size.error.msg':
    'File {{name}} exceeds the maximum allowed size.',
  'global.attachment.not_supported.error.msg':
    'File {{name}} has an unsupported format.',
  'global.attachments.title': 'Attachment',
  'global.wrong_msg.title': 'Something went wrong',
  'global.actions.title': 'Actions',
  'general.sort_by.txt': 'Sort by',
  'journals.daily.title': 'Daily',
  'journals.journal.title': 'Journal',
  'journals.journals.title': 'Journals',
  'journals.weekly.title': 'Weekly',
  'journals.weekly_journals.title': 'Weekly Journals',
};

const interpolate = (
  template: string,
  params?: Record<string, unknown>,
): string => {
  if (!params) return template;
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
};

const createTranslationMock = (
  messages: Record<string, string>,
  locale: HessaLocale,
): DsTranslationService &
  Pick<HesTranslateService, 't' | 'enumT' | 'globalTObj'> &
  Partial<TranslocoService> => {
  const translate = (key: string, params?: Record<string, unknown>) =>
    interpolate(messages[key] ?? key, params);
  const enumT = (key: string, params?: Record<string, unknown>) =>
    interpolate(messages[`enum.${key?.toUpperCase()}`] ?? key, params);

  return {
    getActiveLang: () => locale,
    setActiveLang: () => undefined,
    translate,
    selectTranslate: (key: string, params?: Record<string, unknown>) =>
      of(translate(key, params)),
    t: translate,
    enumT,
    globalTObj: {
      delete: translate('global.delete.btn'),
      cancel: translate('global.cancel.btn'),
      edit: translate('global.edit.btn'),
      view: translate('global.view.btn'),
      save: translate('global.save.btn'),
      add: translate('global.add.btn'),
      close: translate('global.close.btn'),
      yes: translate('global.yes.btn'),
      no: translate('global.no.btn'),
      update: translate('global.update.btn'),
      create: translate('global.create.btn'),
      deleteConfirm: translate('global.delete_confirm.btn'),
      none: translate('global.none.txt'),
      you: translate('global.you.txt'),
      className: (classNumber: number) =>
        `${translate('global.class.title')} ${classNumber}`,
    },
  } as any;
};

const createToastrMock = (): Partial<ToastrService> => ({
  success: () => createActiveToastMock(),
  error: () => createActiveToastMock(),
  warning: () => createActiveToastMock(),
  info: () => createActiveToastMock(),
  show: () => createActiveToastMock(),
  clear: () => undefined,
  remove: () => false,
});

const createActiveToastMock = () =>
  ({
    toastId: Date.now(),
    message: '',
    title: '',
    toastRef: {
      afterActivate: () => of(undefined),
      afterClosed: () => of(undefined),
      manualClosed: () => undefined,
      close: () => undefined,
      activate: () => undefined,
    },
    onShown: of(undefined),
    onHidden: of(undefined),
    onTap: of(undefined),
    onAction: of(undefined),
  }) as any;

const createPlatformMock = (
  mobile: boolean,
  locale: HessaLocale,
): Partial<Platform> => ({
  is: (platformName: string) => {
    if (platformName === 'desktop') return !mobile;
    if (['mobile', 'mobileweb', 'ios', 'android'].includes(platformName)) {
      return mobile;
    }
    return false;
  },
  isRTL: locale === 'ar',
  ready: () => Promise.resolve('storybook'),
  width: () => (mobile ? 375 : 1280),
  height: () => (mobile ? 812 : 800),
  backButton: {
    subscribeWithPriority: () => ({ unsubscribe: () => undefined }),
  } as any,
});

const asSignal = <T>(value: T) => (() => value) as any;

const createLayoutServiceMock = (mobile: boolean): Partial<LayoutService> =>
  ({
    windowClass: asSignal(mobile ? 'compact' : 'large'),
    isMobile: asSignal(mobile),
    isTablet: asSignal(false),
    isDesktop: asSignal(!mobile),
    isTabletOrDesktop: asSignal(!mobile),
    isMobileOrTablet: asSignal(mobile),
    isBottomBarVisible: asSignal(true),
    updateBottomBarVisibility: () => undefined,
    showProgressBar: () => undefined,
    hideProgressBar: () => undefined,
  }) as Partial<LayoutService>;

const createFileInteractionMock = (): Partial<DsFileInteractionService> => ({
  isInteractable: () => true,
  getInteractionType: () => 'view',
  handleFile: async () => undefined,
});

export const buildHessaProviders = (
  options: HessaProvidersOptions = {},
): Array<Provider | EnvironmentProviders> => {
  const {
    ionic = true,
    animations = 'noop',
    http = false,
    locale = 'en',
    translations = true,
    toaster = false,
    fileInteractions = false,
    mobile,
    layout = false,
    taiga = false,
    lottie = false,
    translocoTesting = false,
  } = options;

  const providers: Array<Provider | EnvironmentProviders> = [];

  if (ionic) {
    providers.push(provideIonicAngular());
  }

  if (animations === 'browser') {
    providers.push(provideAnimations());
  } else if (animations === 'noop') {
    providers.push(provideNoopAnimations());
  }

  if (http) {
    providers.push(provideHttpClient());
  }

  if (taiga) {
    providers.push(
      importProvidersFrom(ReactiveFormsModule, TuiRootModule, TuiErrorModule),
      {
        provide: TUI_DATE_FORMAT,
        useFactory: (platform: Platform) => (platform.isRTL ? 'YMD' : 'DMY'),
        deps: [Platform],
      },
      {
        provide: TUI_CANCEL_WORD,
        useFactory: (transloco: TranslocoService) =>
          of(transloco.translate('global.cancel.btn')),
        deps: [TranslocoService],
      },
      {
        provide: TUI_DONE_WORD,
        useFactory: (transloco: TranslocoService) =>
          of(transloco.translate('global.ok.btn')),
        deps: [TranslocoService],
      },
    );
  }

  if (lottie) {
    providers.push(
      provideLottieOptions({
        player: () => import('lottie-web'),
      }),
    );
  }

  if (translations !== false) {
    const messages =
      typeof translations === 'object'
        ? { ...DEFAULT_TRANSLATIONS, ...translations }
        : DEFAULT_TRANSLATIONS;
    const translationMock = createTranslationMock(messages, locale);
    if (translocoTesting) {
      providers.push(
        importProvidersFrom(
          TranslocoTestingModule.forRoot({
            langs: {
              en: messages,
              ar: messages,
            },
            translocoConfig: {
              availableLangs: ['en', 'ar'],
              defaultLang: locale,
            },
            preloadLangs: true,
          }),
        ),
        { provide: DS_TRANSLATION_TOKEN, useValue: translationMock },
        { provide: HesTranslateService, useValue: translationMock },
      );
    } else {
      providers.push(
        { provide: DS_TRANSLATION_TOKEN, useValue: translationMock },
        { provide: HesTranslateService, useValue: translationMock },
        { provide: TranslocoService, useValue: translationMock },
      );
    }
  }

  if (toaster === 'mock') {
    providers.push({ provide: ToastrService, useValue: createToastrMock() });
  } else if (toaster === 'real') {
    providers.push(
      provideToastr({
        timeOut: 3000,
        easeTime: 180,
        toastComponent: DsToastComponent,
        closeButton: true,
        positionClass: 'toast-top-right',
      }),
    );
  }

  if (mobile !== undefined) {
    providers.push({
      provide: Platform,
      useValue: createPlatformMock(mobile, locale),
    });
  }

  if (layout) {
    providers.push({
      provide: LayoutService,
      useValue: createLayoutServiceMock(mobile ?? false),
    });
  }

  if (fileInteractions === 'mock') {
    providers.push({
      provide: DsFileInteractionService,
      useValue: createFileInteractionMock(),
    });
  }

  return providers;
};

export const withHessaProviders = (options: HessaProvidersOptions = {}) =>
  applicationConfig({
    providers: buildHessaProviders(options),
  });
