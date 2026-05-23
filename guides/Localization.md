# Localization

## Table of Contents

- [Overview](#overview)
- [Tools](#tools)
- [Notes](#notes)
- [Localization in Template (HTML)](<#Localization-in-Template-(HTML)>)
- [Localization in Components](#Localization-in-Components)
- [Working with Enums](#working-with-Enums)
- [use different language from the active one inside part of your page](#use-different-language-from-the-active-one-inside-part-of-your-page)

## Overview

The NCLE application is designed to be internationalized. This means that the application should be able to display text in multiple languages.

## Tools

- Frontitude for content management
- Transloco for Angular localization

## Notes

- Locale files are no longer lazy loaded. This means that the locale files will be loaded before the application is bootstrapped. so you dont have to worry about loading the locale files in your modules.

## Localization in Template (HTML)

1. import transloco directive to you component imports

```typescript
import { TranslocoModule } from '@ngneat/transloco';

@NgModule({
  imports: [
    TranslocoModule,
  ],
})
```

2. add the `transloco` directive to your template and start using the `t` function

```jsx
<div *transloco="let t">
    {{ t("global.attachments.title") }}
</div>
```

3. (optional) give the t function scope access
   this could be useful if you want to use scoped access in your templates

```jsx
<div *transloco="let enum; read: 'enum'">
    {{ enum(ticketDetails()!.status.toUpperCase()) }}
</div>
```

snippet from [<div](https://github.com/ncle-edu/hessa-fe/blob/767c8b227c0da4140993006ffe4506719c0aed3f/src/app/pages/support-tickets/components/ticket-details/ticket-details.component.html#L40-L51)

## Localization in Components

1. import transloco service to your component

```typescript
import { TranslocoService } from "@jsverse/transloco";
    ...
private readonly translocoService = inject(TranslocoService);
```

2. use transloco service in your component to translate your text

```js
this.toastrService.success("", this.translocoService.translate("attendance.attendance_successfully_submitted.txt"));
```

snippet from [this.toastrService.success(](https://github.com/ncle-edu/hessa-fe/blob/767c8b227c0da4140993006ffe4506719c0aed3f/src/app/pages/attendance/pages/mark-attendance/mark-attendance.page.ts#L136-L141)

## working with Enums

to translate enums, you can use the `enumLang` pipe or you can do manually

### using the `enumLang` pipe

1. import the pipe to your component

```typescript
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';

@Component({
  ...
  imports: [
    ...
    EnumLangPipe,
  ],
})
```

2. use the pipe in your template

> note: you can use the optional `lang` attribute to specify the language you want to use, it will default to current active language

```html
<h5 class="text-sm font-semibold text-[#AEAFB8]">{{ activeType.data.name | enumLang: language() }}</h5>
```

[<h5 class="text-sm font-semibold text-[#AEAFB8]">](https://github.com/ncle-edu/hessa-fe/blob/767c8b227c0da4140993006ffe4506719c0aed3f/src/app/pages/help-center/pages/view-user-manual/components/article-detail/article-detail.component.html#L31-L35)

### manually

```html
<div *transloco="let enum; read: 'enum'">{{ enum(escalation.supportType.name) | uppercase }}</div>
```

snippet from [escalation-level-dialog.component.html](https://github.com/ncle-edu/hessa-fe/blob/767c8b227c0da4140993006ffe4506719c0aed3f/src/app/pages/configure-escalation/components/escalation-level-dialog/escalation-level-dialog.component.html#L60-L62)

## use different language from the active one inside part of your page

if you want transloco to use a different language than the active one while keeping active one as is,

you can use the `lang` attribute you just need to tell transloco to fetch the second language file like this:

```typescript
this.translocoService.load("ar").subscribe();
```

[this.translocoService.load('ar').subscribe();](https://github.com/ncle-edu/hessa-fe/blob/767c8b227c0da4140993006ffe4506719c0aed3f/src/app/pages/help-center/pages/view-faq/view-faq.page.ts#L132-L133)

### using transloco pipe

1. import transloco pipe to your component

```typescript
import { TranslocoPipe } from "@jsverse/transloco";
    ...
@Component({
  ...
  imports: [
    ...
    TranslocoPipe,
  ],
})
```

2. use the pipe in your template

```html
<app-hes-input [placeholder]="('global.search.placeholder' | transloco:{}:languageCtrl.value!)"> ... </app-hes-input>
```

snippet from [<app-hes-input](https://github.com/ncle-edu/hessa-fe/blob/767c8b227c0da4140993006ffe4506719c0aed3f/src/app/pages/help-center/pages/view-faq/view-faq.page.html#L9-L15)

### using transloco directive

```html
<ng-container *transloco="let tAr; lang: 'ar'">
  <p>{{ tAr('title') }}</p>
</ng-container>
```
