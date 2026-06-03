# nx design system — AI Usage Guide

> **Who this is for:** AI assistants and developers using AI-assisted code generation to build features with the nx design system.

---

## 1. Overview

The nx design system is a standalone Angular component library built for a bilingual (Arabic/English) educational platform. It targets web, iOS, and Android via Ionic Capacitor and uses:

- **Angular 17+** with signal inputs (`input()`, `output()`)
- **Ionic Angular** for mobile modals and navigation
- **Tailwind CSS** with custom design tokens
- **FontAwesome Pro** icons + ng-icons
- **Angular CDK** for overlays (desktop dropdowns)
- **Transloco** for i18n

For portable handoffs to external coding agents such as Claude Code, Cursor,
Antigravity, or chat-based LLMs, start with
`docs/storybook-agent/operating-guide.md`. That repo-level guide lists the
exact context files to provide, component/source/story lookup rules, token
rules, and mobile/desktop overlay behavior.

### How to use this guide with AI tools

1. Read `design-system/ai-manifest.json` for machine-readable component metadata.
2. Use the **Component Quick Reference** table below to find the right component.
3. Follow the **Rules for AI Code Generation** section — these prevent the most common AI mistakes.
4. Validate generated code against the **Page Audit Checklist**.

---

## 2. Component Quick Reference

| Component                  | Selector              | Category | Key Inputs                                                                                                     | Storybook Path                  |
| -------------------------- | --------------------- | -------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `DsButtonComponent`        | `ds-button`           | action   | `variant`, `size`, `loading`, `disabled`, `fullWidth`, `iconStart`, `iconEnd`                                  | 1. P0 Components/Button         |
| `DsInputComponent`         | `app-ds-input`        | input    | `label`, `placeholder`, `errorMessage`, `disabled`, `iconStart`, `iconEnd`, `dsType`, `inputMode`, `maxLength` | 1. P0 Components/Input          |
| `DsSelectComponent`        | `app-ds-select`       | input    | `[config]` (required), `disabled`                                                                              | 1. P0 Components/Select         |
| `DsCheckboxComponent`      | `app-ds-checkbox`     | input    | `title`, `variantInput`, `size`, `defaultValue`, `required`, `disabled`, `helperText`                          | 1. P0 Components/Checkbox       |
| `DsModalComponent`         | `ds-modal`            | layout   | `headerConfig`, `footerConfig`, `modalSize`, `dismissFn`, `scrollableContent`                                  | 1. P0 Components/Modal          |
| `DsChipComponent`          | `app-ds-chip`         | action   | `text`, `variant`, `displayType`, `removable`, `startIcon`, `static`                                           | 1. P0 Components/Chip           |
| `DsTabsComponent`          | `app-ds-tabs`         | display  | `tabs`, `activeTabId`, `variant`, `scrollable`                                                                 | 1. P0 Components/Tabs           |
| `AvatarComponent`          | `app-ds-avatar`       | display  | `fullName` (required), `imageUrl`, `size`, `color`, `includeBorder`                                            | 1. P0 Components/Avatar         |
| `DsIconComponent`          | `app-ds-icon`         | display  | `icon`, `size`, `cssClass`                                                                                     | 1. P0 Components/Icon           |
| `DsProgressBarComponent`   | `app-ds-progress-bar` | display  | `progress`, `variant`, `size`, `showPercentage`                                                                | 2. P1 Components/Progress Bar   |
| `DsSwitchComponent`        | `app-ds-switch`       | input    | `type`, `option1`, `option2`, `onColor`, `offColor`                                                            | 1. P0 Components/Switch         |
| `DsTextareaComponent`      | `app-ds-textarea`     | input    | `label`, `placeholder`, `rows`, `maxLength`, `required`, `showCharacterCount`                                  | 1. P0 Components/Text Area      |
| `DsSidebarComponent`       | `ds-sidebar`          | layout   | `headerConfig`, `footerConfig`, `dismissFn`, `scrollableContent`                                               | 2. P1 Components/Sidebar        |
| `DsAccordionComponent`     | `ds-accordion`        | layout   | `title`, `subtitle`, `tags`, `expanded`, `disabled`, `menuItems`                                               | 2. P1 Components/Accordion      |
| `SearchBoxComponent`       | `app-search-box`      | input    | `value`, `placeholderTxt`, `includeAddButton`, `autoFocus`, `autoFocusDelay`                                   | 2. P1 Components/Search Box     |
| `DsIconContainerComponent` | `ds-icon-container`   | display  | `[config]` (required)                                                                                          | 2. P1 Components/Icon Container |

---

## 3. Common AI Prompts

Use these example prompts to generate typical nx design system UI patterns.

### Build a form with input, select, and a primary button

```
Build an Angular component with the nx design system.
Include:
- A text input (app-ds-input) bound to formControl "name" with label "Full Name"
- A select (app-ds-select) bound to formControl "role" with [config]="roleSelectConfig"
- A submit button (ds-button) with variant="primary" and size="lg"
All inputs use Angular reactive forms. Follow the Rules for AI Code Generation in AI_USAGE.md.
```

**Expected output pattern:**

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <app-ds-input [label]="'Full Name'" formControlName="name" />

  <app-ds-select [config]="roleSelectConfig" formControlName="role" />

  <ds-button [variant]="'primary'" [size]="'lg'" type="submit"> Submit </ds-button>
</form>
```

---

### Show a student dashboard with tabs and avatar

```
Build a student dashboard header using the nx design system.
Include:
- A student avatar (app-ds-avatar) showing the student's name and profile image
- A tab bar (app-ds-tabs) with tabs for Overview, Grades, and Attendance
- The page should render correctly in student theme (data-role="student" context)
```

**Expected output pattern:**

```html
<div data-role="student">
  <div class="flex items-center gap-3 p-4">
    <app-ds-avatar [fullName]="student.fullName" [imageUrl]="student.imageUrl" [size]="'lg'" />
    <h1 class="text-ds-lg font-bold">{{ student.fullName }}</h1>
  </div>

  <app-ds-tabs [tabs]="tabs" [activeTabId]="activeTabId" (tabChange)="onTabChange($event)" />
</div>
```

```typescript
tabs: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'grades', label: 'Grades' },
  { id: 'attendance', label: 'Attendance' },
];
```

---

### Create a modal with scrollable content

```
Create an Angular service method that opens a nx design system modal with:
- A header showing "Edit Profile" with a close button
- Scrollable body content
- Footer with primary "Save" button and secondary "Cancel" button
- The modal should call this.form.save() on primary click
```

**Expected output pattern:**

```typescript
async openEditModal() {
  const modal = await this.modalCtrl.create({
    component: EditProfileModalComponent,
  });
  await modal.present();
}
```

```html
<!-- Inside EditProfileModalComponent template -->
<ds-modal
  [headerConfig]="{ title: 'Edit Profile', showCloseButton: true }"
  [footerConfig]="{
    primaryButton: { label: 'Save' },
    secondaryButton: { label: 'Cancel' }
  }"
  [scrollableContent]="true"
  [dismissFn]="dismissFn"
  (primaryClick)="onSave()"
  (closeClick)="dismiss()"
>
  <!-- form content goes here -->
</ds-modal>
```

---

### Build a filterable list with search and chips

```
Build a list page with:
- A search box (app-search-box) with debounced search
- A row of filter chips (app-ds-chip) for category filtering
- Results displayed in a list
```

**Expected output pattern:**

```html
<app-search-box [placeholderTxt]="'Search...'" (searchChange)="onSearch($event)" />

<div class="mt-3 flex flex-wrap gap-2">
  @for (filter of filters; track filter.id) {
  <app-ds-chip [text]="filter.label" [variant]="activeFilter === filter.id ? 'primary' : 'default'" (click)="setFilter(filter.id)" />
  }
</div>
```

---

## 4. Token Reference

Design tokens are defined in CSS custom properties and mapped to Tailwind utility classes. The key namespaces are:

### Color Tokens

| Namespace                 | Example Tailwind Class                          | Purpose                         |
| ------------------------- | ----------------------------------------------- | ------------------------------- |
| `brand`                   | `bg-brand`, `text-brand`, `border-brand-200`    | Primary brand color             |
| `neutral-cool`            | `border-neutral-cool-100`, `bg-neutral-cool-50` | Neutral borders and backgrounds |
| `surface-primary`         | `bg-surface-primary`                            | Main white/light background     |
| `surface-secondary-light` | `bg-surface-secondary-light`                    | Disabled field background       |
| `surface-danger-subtle`   | `bg-surface-danger-subtle`                      | Error field background          |
| `error` / `error-ds-*`    | `border-error`, `bg-error-ds-50`                | Error/danger states             |
| `content-high`            | `text-content-high`                             | Primary text color              |
| `content-low`             | `text-content-low`                              | Disabled/placeholder text       |
| `pastels-*`               | `bg-pastels-indigo-50`                          | Pastel background variants      |

### Spacing Tokens

| Token   | Tailwind Class         | Value               |
| ------- | ---------------------- | ------------------- |
| `ds-sm` | `p-ds-sm`, `gap-ds-sm` | Small spacing       |
| `ds-md` | `p-ds-md`, `gap-ds-md` | Medium spacing      |
| `ds-lg` | `p-ds-lg`, `gap-ds-lg` | Large spacing       |
| `ds-xl` | `p-ds-xl`, `px-ds-xl`  | Extra-large spacing |

### Typography Tokens

| Token     | Tailwind Class | Usage                  |
| --------- | -------------- | ---------------------- |
| `ds-base` | `text-ds-base` | Body text / input text |
| `ds-lg`   | `text-ds-lg`   | Large body / button lg |
| `ds-sm`   | `text-ds-sm`   | Small labels           |

### Border Radius Tokens

| Token     | Tailwind Class    | Usage                     |
| --------- | ----------------- | ------------------------- |
| `ds-md`   | `rounded-ds-md`   | Chip card, small elements |
| `ds-lg`   | `rounded-ds-lg`   | Inputs, buttons (md)      |
| `ds-xl`   | `rounded-ds-xl`   | Buttons (lg), modals      |
| `ds-full` | `rounded-ds-full` | Pill chips, avatars       |

### Font Families

| Context       | Font         | Class                                        |
| ------------- | ------------ | -------------------------------------------- |
| Default (LTR) | Nunito       | Applied globally                             |
| RTL / Arabic  | Lama Rounded | Applied via `dir="rtl" lang="ar"` on wrapper |

---

## 5. Rules for AI Code Generation

These are non-obvious rules that AI tools frequently get wrong. Follow them exactly.

### Rule 1: Button text goes in ng-content, not a title input

```html
<!-- CORRECT -->
<ds-button [variant]="'primary'">Save Changes</ds-button>

<!-- WRONG — title is an accessibility/tooltip hint, not the visible label -->
<ds-button [variant]="'primary'" title="Save Changes" />
```

### Rule 2: DS_TRANSLATION_TOKEN is required for DsTabsComponent

The tabs component uses `DsTranslatePipe` internally. Without the token, tab labels will not render.

```typescript
// In your component or module providers:
import { DS_TRANSLATION_TOKEN } from '@ds/i18n/ds-translate.pipe';

@Component({
  providers: [
    {
      provide: DS_TRANSLATION_TOKEN,
      useValue: (key: string) => key, // or inject TranslocoService
    },
  ],
})
```

### Rule 3: DsSelectComponent opens a Modal on mobile

When `isMobile=true` (detected automatically from the platform), the select dropdown renders as an `IonModal` instead of a CDK overlay. This means:

- The `IonModal` must be available in the component imports
- Positioning/z-index CSS that works on desktop may not apply on mobile
- Test both mobile and desktop rendering

```typescript
// Ensure IonModal is imported in the host module/component:
import { IonModal } from "@ionic/angular/standalone";
```

### Rule 4: Student theme is applied via a data attribute on an ancestor

The student theme applies to all child components. Never apply student-specific classes manually on individual components.

```html
<!-- CORRECT — apply at the page/section level -->
<div data-role="student">
  <app-ds-input [label]="'Name'" formControlName="name" />
  <ds-button [variant]="'primary'">Submit</ds-button>
</div>

<!-- WRONG — do not add student: Tailwind variants manually -->
<app-ds-input class="student:border-4" [label]="'Name'" />
```

The `student:` Tailwind variant activates automatically when `[data-role="student"]` exists on any ancestor element.

### Rule 5: All signal inputs require bracket binding

Every input in this design system uses Angular's `input()` signal API. This means you **must** use `[inputName]="value"` syntax — even for static string values.

```html
<!-- CORRECT -->
<ds-button [variant]="'primary'" [size]="'lg'" [disabled]="isLoading"> Save </ds-button>

<!-- WRONG — will not work for signal inputs -->
<ds-button variant="primary" size="lg">Save</ds-button>
```

**Exception:** `title` and `type` on `ds-button` can use string literals because they are standard HTML attributes passed through. But all custom DS inputs must use bracket syntax.

### Rule 6: RTL support — set dir and lang on the wrapper, use Lama Rounded font

```html
<!-- Wrap Arabic content at the page or section level -->
<div dir="rtl" lang="ar">
  <app-ds-input [label]="'الاسم'" formControlName="name" />
</div>
```

- The Lama Rounded font is loaded globally and applies automatically when `dir="rtl"` is set.
- Icon components automatically mirror directional icons (chevrons, arrows) via DsIconComponent.
- Do not add manual `transform: scaleX(-1)` on icons — it is handled internally.

### Rule 7: DsSelectComponent config is a required signal input — use [config]

```html
<!-- CORRECT -->
<app-ds-select [config]="selectConfig" formControlName="category" />

<!-- WRONG — config is required and must be bound -->
<app-ds-select formControlName="category" />
```

The `config` input carries all select settings including `label`, `placeholder`, `options`, `isMultiple`, and `loadOptions`. Build config objects in the component class, not inline in the template.

### Rule 8: DsModalComponent is always a child of IonModal

`ds-modal` is the **inner layout wrapper**, not the dialog/overlay itself. Always place it inside an `IonModal`:

```typescript
// Open the modal from a service or component:
const modal = await this.modalController.create({
  component: MyModalContentComponent, // this component contains <ds-modal>
  cssClass: "ds-modal-lg",
});
await modal.present();
```

```html
<!-- MyModalContentComponent template -->
<ds-modal [headerConfig]="{ title: 'My Modal' }" [dismissFn]="dismiss" [scrollableContent]="true">
  <!-- content -->
</ds-modal>
```

### Rule 9: Use formControlName or [formControl] — not ngModel

This design system does not support `[(ngModel)]`. Use reactive forms only.

```html
<!-- CORRECT -->
<app-ds-input formControlName="email" [label]="'Email'" />
<app-ds-input [formControl]="emailCtrl" [label]="'Email'" />

<!-- WRONG -->
<app-ds-input [(ngModel)]="email" [label]="'Email'" />
```

### Rule 10: SearchBoxComponent is NOT a form control

`SearchBoxComponent` does not implement `ControlValueAccessor`. It is standalone and emits `(searchChange)` events. Do not use it with `formControlName`.

```html
<!-- CORRECT -->
<app-search-box (searchChange)="onSearch($event)" [value]="searchTerm" />

<!-- WRONG -->
<app-search-box formControlName="search" />
```

---

## 6. Stroke States Reference

All form-like components (input, textarea, checkbox, select trigger) share a unified border token system. These states apply automatically via computed classes in each component — do not override them with arbitrary Tailwind classes.

### Standard Stroke States

| State    | Border Class                                     | Background Class              | Notes                        |
| -------- | ------------------------------------------------ | ----------------------------- | ---------------------------- |
| Default  | `border-neutral-cool-100` (#e5e6e7)              | `bg-surface-primary`          | All form fields at rest      |
| Hover    | `hover:border-neutral-cool-200` (#ccced0)        | `bg-surface-primary`          | Subtle border darkening      |
| Focused  | `focus-within:border-neutral-cool-700` (#4d545a) | `bg-surface-primary`          | Clear focus indicator        |
| Error    | `!border-error`                                  | `!bg-surface-danger-subtle`   | Applied when `hasError=true` |
| Disabled | `border-neutral-cool-100`                        | `!bg-surface-secondary-light` | Muted background, no hover   |

### Student Theme Stroke Additions

When `data-role="student"` is present on an ancestor, form fields add a thick bottom border for a playful 3D effect:

| Component             | Student Border Override                       |
| --------------------- | --------------------------------------------- |
| `DsInputComponent`    | `student:border-[4px] student:border-b-[8px]` |
| `DsTextareaComponent` | `student:border-[4px] student:border-b-[8px]` |
| `DsCheckboxComponent` | Matching border-b treatment on checkbox box   |

### Error State Details

Error state is set internally when the bound `FormControl` has `status === 'INVALID'` (after touch). It can also be forced by passing `[errorMessage]="'Your error text'"`:

```html
<app-ds-input [label]="'Email'" formControlName="email" [errorMessage]="form.get('email')?.hasError('email') ? 'Invalid email format' : ''" />
```

Use `[suppressFormError]="true"` on `DsInputComponent` to show the error border without a message (e.g., when the message is displayed elsewhere).

---

## 7. Page Audit Checklist

When reviewing a generated or existing page for design system compliance, check the following:

### Component Usage

- [ ] **Button labels** are in `ng-content`, not `title` input
- [ ] **No more than one** `variant=primary` button is visible at a time
- [ ] **Signal inputs** all use bracket syntax `[inputName]="value"`
- [ ] **Form fields** use `formControlName` or `[formControl]`, not `ngModel`
- [ ] **SearchBoxComponent** is not wired to a `FormControl`
- [ ] **DsSelectComponent** has `[config]` bound, not individual option inputs
- [ ] **DsTabsComponent** has `DS_TRANSLATION_TOKEN` provided in the host

### Theming & Layout

- [ ] **Student theme** is applied at section/page level via `data-role="student"`, not per-component
- [ ] **RTL** wrapping is `dir="rtl" lang="ar"` on a container element, not on individual components
- [ ] **Modal content** is inside a `ds-modal` which is inside an `IonModal`
- [ ] **Scrollable modals** have `[scrollableContent]="true"` set on `ds-modal`
- [ ] **Sidebar content** defaults to scrollable (no need to set `scrollableContent=true`)

### Accessibility

- [ ] Every `app-ds-input` and `app-ds-textarea` has a `[label]` bound (or `[aria-label]` if label is visually hidden)
- [ ] Every `app-ds-avatar` has `[fullName]` bound (used as alt text fallback)
- [ ] Icon-only buttons have a `title` or `aria-label`
- [ ] Disabled state is propagated via `FormControl.disable()` or `[disabled]="true"`, not CSS alone

### Mobile / Responsive

- [ ] **DsSelectComponent** tested on mobile — overlay will appear as `IonModal`
- [ ] **SearchBoxComponent** with `manageBottomBarVisibility=true` (default) hides bottom nav bar on focus — verify this is intentional
- [ ] **DsTabsComponent** — consider using `DsTabsWithSwipeComponent` on mobile for swipe support
- [ ] Button `fullWidth=true` is used in mobile stacked action layouts

### Design Tokens

- [ ] Colors use design token Tailwind classes (`text-content-high`, `bg-surface-primary`) — not raw hex values
- [ ] Spacing uses token classes (`p-ds-lg`, `gap-ds-md`) — not arbitrary Tailwind spacing where a token exists
- [ ] No `text-gray-*` or `bg-gray-*` — use `text-neutral-cool-*` and `bg-neutral-cool-*`
- [ ] Border radius uses token classes (`rounded-ds-xl`) — not `rounded-xl` or `rounded-2xl`

### Stroke State Correctness

- [ ] Error messages use the `errorMessage` input on `DsInputComponent` — not a custom `<p>` below the field
- [ ] Error state is not forced via static CSS class — it is driven by `FormControl` status
- [ ] Disabled fields use `FormControl.disable()` or `[disabled]="true"` — not `pointer-events-none` workarounds

---

## 8. Import Reference

Quick import paths for the most common components:

```typescript
import { DsButtonComponent } from "@ds/button/button.component";
import { DsInputComponent } from "@ds/input/input.component";
import { DsSelectComponent } from "@ds/select/select.component";
import { DsCheckboxComponent } from "@ds/checkbox/checkbox.component";
import { DsModalComponent } from "@ds/modal/modal.component";
import { DsChipComponent } from "@ds/chip/chip.component";
import { DsTabsComponent } from "@ds/tabs/tabs.component";
import { AvatarComponent } from "@ds/avatar/avatar.component";
import { DsIconComponent } from "@ds/icon/icon.component";
import { DsProgressBarComponent } from "@ds/progress-bar/progress-bar.component";
import { DsSwitchComponent } from "@ds/switch/switch.component";
import { DsTextareaComponent } from "@ds/text-area/text-area.component";
import { DsSidebarComponent } from "@ds/sidebar/sidebar.component";
import { DsAccordionComponent } from "@ds/accordion/accordion.component";
import { SearchBoxComponent } from "@ds/search-box/search-box.component";
import { DsIconContainerComponent } from "@ds/icon-container/icon-container.component";
```

> The `@ds/` path alias maps to `src/app/design-system/` as configured in `tsconfig.json`.

---

_Generated: 2026-05-15 | Design System version: 1.0.0_
