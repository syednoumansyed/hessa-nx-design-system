# Hessa Design System LLM Operating Guide

Last updated: 2026-06-02

Use this document when asking an external coding agent, such as Claude Code,
Cursor, Antigravity, or any general LLM, to build or audit Hessa UI. It is
written as a portable context pack: it tells the agent which files to load,
which design-system rules matter, and how components behave across desktop,
mobile, RTL, and student-role contexts.

## How To Give This Work To Any LLM

### Minimum Context Pack

For a small component or page task, give the agent these files:

```text
docs/llm-design-system-operating-guide.md
src/app/design-system/AI_USAGE.md
src/app/design-system/ai-manifest.json
src/app/design-system/design-tokens.json
src/stories/docs/TokenSystem.mdx
src/stories/docs/RTLGuide.mdx
.storybook/hessa-providers.ts
```

Then add the specific component source and story files for the task. Example:

```text
src/app/design-system/modal-sheet/modal-sheet.service.ts
src/app/design-system/modal-sheet/modal-sheet.types.ts
src/app/design-system/modal-sheet/modal-sheet-container.component.ts
src/app/design-system/sidebar/sidebar.service.ts
src/app/design-system/sidebar/sidebar.types.ts
src/stories/components/ds-modal-sheet/ds-modal-sheet.stories.ts
src/stories/components/ds-sidebar/ds-sidebar.stories.ts
```

### Full Storybook Audit Context Pack

For broad Storybook or design-system work, also provide:

```text
docs/storybook-audit-findings.md
scripts/audit-stories-coverage.ts
src/stories/components/<target-story-folder>/<target>.stories.ts
src/app/design-system/<target-component-folder>/**
```

If the target has service or overlay behavior, include the service and wrapper
components too. For example, modal work needs `modal.service.ts`,
`modal-wrapper.component.ts`, `modal.component.ts`, `modal.types.ts`, and the
target story.

### Copy-Paste Prompt For Any Agent

```text
You are working in the Hessa Angular/Ionic design-system repo.

Before editing, read:
- docs/llm-design-system-operating-guide.md
- src/app/design-system/AI_USAGE.md
- src/app/design-system/ai-manifest.json
- src/app/design-system/design-tokens.json
- src/stories/docs/TokenSystem.mdx
- src/stories/docs/RTLGuide.mdx
- .storybook/hessa-providers.ts

Rules:
- Prefer existing Hessa design-system components over raw HTML controls.
- Use reactive forms: [formControl] or formControlName. Do not use ngModel.
- Use semantic/token classes, not raw hex colors or ad hoc spacing.
- Cover desktop, mobile, RTL, student role, disabled, loading, and error states only when the production component supports them.
- For Storybook, use withHessaProviders() instead of local provider boilerplate.
- If a story claims service behavior, exercise the real service path or a realistic local fake with play().
- Do not change production component APIs unless the source exposes a real mismatch.

Task:
<describe the exact page/component/story change here>

Verification:
- npm run storybook:audit
- npx tsc -p .storybook/tsconfig.json --noEmit
- npm run build-storybook
```

### Context Strategy By Tool

| Tool | Best way to provide context |
| --- | --- |
| Claude Code | Ask it to read this guide plus the exact source/story files. For large tasks, give it only one component family at a time so it does not generalize from unrelated stories. |
| Cursor | Add this file and the target source/story files to context. Keep `ai-manifest.json` pinned or referenced, then ask for scoped edits. |
| Antigravity | Use the copy-paste prompt above and attach this guide, the manifest, token docs, and target files. Ask it to report changed file paths and verification commands. |
| Any chat LLM | Paste the "Minimum Context Pack" text, then paste the relevant source snippets. Do not ask it to infer Hessa rules from generic Angular or Ionic docs. |

## Work Protocol For Storybook Tasks

Use this order for story work:

1. Read production component source, template, service, types, and existing story.
2. Identify real inputs, outputs, CVA behavior, service branches, tokens, and platform branches.
3. Use `withHessaProviders()` for Storybook providers.
4. Replace raw controls and fake examples with production-like controls when meaningful.
5. Add `play()` only for real rendered contracts: overlay opens, control updates, callback fires, disabled blocks, loading appears, dismissal returns role/data.
6. Run the audit, TypeScript, and build gates.

Do not expand visual-only variants before source/provider/service/platform/token parity is correct.

## Global Rules LLMs Must Follow

### Angular And Forms

- Most components use Angular signal inputs. Bind custom DS inputs with brackets, for example `[variant]="'primary'"`.
- Use reactive forms. Prefer `[formControl]` or `formControlName`.
- Do not use `[(ngModel)]` in new stories or examples unless the production component is explicitly template-driven.
- Do not fake validation with loose red text when a real `FormControl` and validator can drive the state.
- Do not add new production inputs to make a story easier unless the component source exposes a real API mismatch.

### Storybook Providers

Use `.storybook/hessa-providers.ts`:

```ts
withHessaProviders()
withHessaProviders({ locale: 'ar' })
withHessaProviders({ mobile: true, layout: true })
withHessaProviders({ taiga: true })
withHessaProviders({ lottie: true })
withHessaProviders({ toaster: 'mock' })
withHessaProviders({ fileInteractions: 'mock' })
```

Avoid repeating local `provideIonicAngular()`, translation token providers, toaster mocks, Taiga providers, or Lottie setup in individual stories when the shared helper can do it.

### Tokens And Styling

- Prefer semantic tokens over primitives: `text-content-high`, `text-content-mid`, `bg-surface-primary`, `bg-surface-brand-subtle`, `border-stroke-black-08`.
- Prefer design-system spacing and gap tokens: `p-ds-lg`, `px-ds-xl`, `gap-ds-md`, `rounded-ds-xl`.
- Avoid raw hex colors, `text-gray-*`, `bg-gray-*`, arbitrary spacing, and one-off shells unless the source component itself requires them.
- Use CSS logical utilities for RTL: `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`.
- Role theme is applied by ancestor attribute: `<div data-role="student">...</div>`. Do not manually add `student:` classes to consumers unless you are editing the component source.

### RTL And Localization

- Arabic wrapper: `<div dir="rtl" lang="ar">...</div>`.
- LTR wrapper: `<div dir="ltr" lang="en">...</div>`.
- `lang="ar"` activates Lama Rounded font. English uses Nunito.
- Directional icons should be handled by the component or by logical/RTL classes. Do not add random `scaleX(-1)`.
- Use translation services/tokens for labels that production translates.

## Token System Reference

### Breakpoints

| Token group | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| Spacing, gaps, radius | default, below 768px | 768px and up | 1280px and up |
| Typography | default, below 768px | 768px to 1023px | 1024px and up |

Important: typography reaches desktop scale at 1024px, while spacing and layout tokens reach desktop scale at 1280px.

### Spacing Tokens

| Token | CSS variable | Tailwind examples |
| --- | --- | --- |
| xs | `--ds-spacing-xs` | `p-ds-xs`, `px-ds-xs` |
| sm | `--ds-spacing-sm` | `p-ds-sm`, `gap-ds-sm` |
| md | `--ds-spacing-md` | `p-ds-md`, `gap-ds-md` |
| lg | `--ds-spacing-lg` | `p-ds-lg`, `gap-ds-lg` |
| xl | `--ds-spacing-xl` | `p-ds-xl`, `gap-ds-xl` |
| 2xl | `--ds-spacing-2xl` | `p-ds-2xl`, `gap-ds-2xl` |

### Semantic Color Namespaces

| Namespace | Use for |
| --- | --- |
| `content-*` | Text and icon emphasis, for example high, mid, low, error, success, warning. |
| `surface-*` | Backgrounds, action fills, subtle brand surfaces, notification badges. |
| `stroke-*` | Borders and dividers. |
| `feedback-*` | Alert, toast, and feedback state surfaces/strokes. |
| `brand-*` | Brand scale. Use semantic `surface-action` or `content-action` first when possible. |
| `neutral-cool-*` | Neutral primitives. Prefer semantic classes unless the component source already uses primitives. |

### Typography

- Use responsive text classes from the DS typography scale: `text-ds-xs`, `text-ds-sm`, `text-ds-base`, `text-ds-lg`, `text-ds-xl`, `text-ds-2xl`.
- Existing components also use composed typography classes such as `single-line-xs-mid-emphasis`, `content-md-mid-emphasis`, and `heading-h3-mid-emphasis`.
- Do not scale font size with viewport width manually.

### Student Role

Student visual treatment is activated by an ancestor:

```html
<div data-role="student">
  <app-ds-input [label]="'Answer'" formControlName="answer" />
  <ds-button [variant]="'primary'">Submit</ds-button>
</div>
```

Known student-aware components include `ds-button`, `app-ds-input`,
`app-ds-textarea`, and some form primitives. Student styles usually add a thick
3-D bottom border and active-state compensation.

## Device And Overlay Rules

### Overlay Decision Table

| Component/service | Desktop behavior | Mobile/tablet behavior | LLM rule |
| --- | --- | --- | --- |
| `DsModalService` | Ionic modal styled as centered dialog with size class `ds-modal-sm/md/lg`. | Ionic bottom sheet with `ds-modal-mobile-sheet`, breakpoints, optional handle, full-width lg footer buttons by default. | Use for normal modal flows. Do not confuse with `ModalSheetService`. |
| `ds-modal` | Inner shell only. It is not the overlay. | Inner shell only. Safe-area support can be enabled through service config. | Place inside `IonModal` or `DsModalService` wrapper. |
| `ModalSheetService` | Custom sheet stack renders through `ds-modal-sheet-container`. | Same custom stacking sheet. Used especially for iOS page-sheet style flows. | Use when stacking custom sheets or when sidebar config asks for `mobilePresentation: 'modal-sheet'`. |
| `DsSidebarService` | Slide-in sidebar using `DsSidebarWrapperComponent` and sidebar animations. | Default `mobilePresentation: 'bottom-sheet'` uses Ionic bottom sheet via `DsModalWrapperComponent`. `mobilePresentation: 'modal-sheet'` uses `ModalSheetService`. | Test desktop sidebar and both mobile presentations separately. |
| `app-ds-select` | CDK overlay panel with search/options. | Ionic modal sheet branch. | Include both branches in stories when changing overlay behavior. |
| `app-ds-picker-select` | Opens `DsModalService` with picker content. | Opens `DsModalService`, which becomes mobile sheet automatically. | Do not test it as raw inline options; open the service path. |
| `ds-responsive-table` | AG Grid table branch with pagination, selection, filters, and customize-columns. | Mobile list branch with floating actions, sort button/sheet, bulk bar, and load more. | Use `withHessaProviders({ mobile: true, layout: true })` for mobile stories. |
| `ds-responsive-menu` / `ds-menu` | Desktop menu/overlay. | Mobile sheet content for responsive menu paths. | For actions in tables and icon containers, assert menu opens and item emits. |
| `app-search-box` | Debounced search input. | Also hides app bottom bar on focus via `LayoutService`. | In Storybook, fake `LayoutService` with `withHessaProviders({ layout: true })` if asserting focus behavior. |
| `app-ds-tabs` | Scrollable tabs with navigation arrows when overflow exists. | Arrows hidden; use `ds-tabs-with-swipe` for swipe navigation. | Do not claim swipe support on plain `app-ds-tabs`. |

### Modal Sheet Rules

`ModalSheetService` and `DsModalService` are distinct runtime paths.

Use `DsModalService` when:

- The flow is a standard app modal.
- Desktop should be centered dialog.
- Mobile should be Ionic bottom sheet with breakpoints.
- The modal does not need custom sheet stacking.

Use `ModalSheetService` when:

- The flow needs an app-level custom sheet stack.
- Multiple sheets can be layered; top is `active`, previous is `behind`, older entries are `hidden`.
- Hardware back should dismiss the top sheet.
- Backdrop dismissal must be explicit via `backdropDismiss`.

Use `DsSidebarService` with `mobilePresentation: 'modal-sheet'` when:

- The desktop version is a sidebar.
- The mobile version should use the custom sheet stack, not Ionic's draggable bottom sheet.
- Multi-step or nested flows need sheet stacking and close behavior control.

Do not write a story that renders `ds-modal-sheet-item` directly and claim it validates `ModalSheetService.present()`. A real contract story must call `present()` and assert the container renders the content and dismissal returns expected role/data.

### Sidebar Mobile/Desktop Rules

Desktop:

- `DsSidebarService.open()` uses `DsSidebarWrapperComponent`.
- It applies `ds-sidebar` CSS class and slide-in animations.
- Header/footer/content mirror modal API.

Mobile/tablet default:

- `DsSidebarService.open()` uses Ionic modal bottom sheet through `DsModalWrapperComponent`.
- Defaults: `mobileBreakpoint = 1`, `mobileBreakpoints = [0, 1]`, `mobileHandle = false`.
- Footer buttons default to full width and `lg` size.

Mobile/tablet custom modal sheet:

- Set `mobilePresentation: 'modal-sheet'`.
- It calls `ModalSheetService.present()`.
- `closeBehavior: 'current'` closes one sheet. `closeBehavior: 'all'` dismisses the full stack.

## Component Usage Matrix

This matrix covers the current design-system folders. "Story context" points to
the Storybook file when one exists; "source-only" means the component exists but
the audit still reports no story folder.

| Component family | Main selectors | Use for | Key rules for LLMs | Story/source context |
| --- | --- | --- | --- | --- |
| Accordion | `ds-accordion`, `ds-accordion-group` | Disclosure sections, FAQs, grouped settings. | `expanded` is initial state only; listen to `(expandedChange)`. Use `menuItems` for header menus. | `src/stories/components/ds-accordion/ds-accordion.stories.ts` |
| Action List | `ds-action-list`, `ds-action-list-item` | Navigation/action rows with icons, badges, supporting text. | Use for list-style actions, not form inputs. Disabled items must not fire. RTL rotates directional icons. | `src/stories/components/ds-action-list/ds-action-list.stories.ts` |
| AG Grid Table | `app-ds-ag-grid-table` plus cell/header components | Desktop-first dense tables using AG Grid. | Use when true spreadsheet-like grid behavior is needed. Fake state/router services in Storybook. Prefer `persistState=false` in tests. | source-only: `src/app/design-system/ag-grid-table` |
| Alert Message | `alert-message` | Inline alert banners for info, success, warning, error, exciting states. | Use DS alert state props, not raw colored cards. Close behavior should emit real close output. | `src/stories/components/ds-alert-message/ds-alert-message.stories.ts` |
| Attachment | `ds-attachment-form-control`, previews/gallery | File upload, preview, image gallery, attachment form value. | Use file interaction mocks in Storybook. Assert rejected file states through callbacks, not fake text. | `src/stories/components/ds-attachment/ds-attachment.stories.ts` |
| Avatar | `app-ds-avatar` | User profile photo or initials fallback. | Always pass `fullName`; use local/static assets in stories instead of external image URLs. | `src/stories/components/ds-avatar/ds-avatar.stories.ts` |
| Button | `ds-button` | Primary/secondary actions, submit, link-style commands. | Visible label is content projection, not `title`. One primary CTA per view. Loading/disabled must block action. | `src/stories/components/ds-button/ds-button.stories.ts` |
| Calendar | `ds-attendance-calendar`, `ds-calendar-month`, `ds-calendar-summary` | Attendance/calendar summaries and month grids. | RTL reverses directional behavior; use Taiga provider support when needed. | `src/stories/components/ds-calendar/ds-calendar.stories.ts` |
| Carousal | `ds-carousal` | Slide carousel displays. | Keep spelling as `carousal`. Cover loading skeleton and RTL if adding stories. | source-only: `src/app/design-system/carousal` |
| Checkbox | `app-ds-checkbox` | Single boolean or select-all child checkbox. | Use CVA/FormControl when form-bound. Use `variantInput="indeterminate"` for partial selection. | `src/stories/components/ds-checkbox/ds-checkbox.stories.ts` |
| Checkbox Group | `app-ds-checkbox-group` | Related multi-select checkbox set. | Use `value="SELECT_ALL"` only for the select-all child. Group value excludes `SELECT_ALL`. | `src/stories/components/ds-checkbox-group/ds-checkbox-group.stories.ts` |
| Chip | `app-ds-chip` | Tags, badges, removable selected values, filter chips. | Use `static=true` for read-only tags. Use `(remove)`, not click, for removal. | `src/stories/components/ds-chip/ds-chip.stories.ts` |
| Chip Selector | `app-ds-chip-selector` | Inline single or multi chip selection. | Use for compact selectable filters/options. Disabled options must not change selected state. | `src/stories/components/ds-chip-selector/ds-chip-selector.stories.ts` |
| DS Responsive Table | `ds-responsive-table` | One component that renders AG Grid desktop and mobile list. | Provide both mobile and desktop stories. Use `LayoutService`/provider mocks for branch coverage. | `src/stories/components/ds-responsive-table/ds-responsive-table.stories.ts` |
| Expandable | `ds-expandable` | Simple expand/collapse content without accordion chrome. | Use when header/tags/menu are unnecessary. Assert toggle state if interactive. | `src/stories/components/ds-expandable/ds-expandable.stories.ts` |
| Feedback | `ds-feedback` | Icon/title/message content for feedback modals and status panels. | Use inside `DsModalService` or feedback modal paths for service contract stories. | `src/stories/components/ds-feedback/ds-feedback.stories.ts` |
| Feedback Modal | service/story wrapper using `ds-feedback` | Confirmation, success, warning, error modal flows. | Exercise service-backed open/dismiss paths. Do not render only a fake static panel. | `src/stories/components/ds-feedback-modal/ds-feedback-modal.stories.ts` |
| Filter Panel | `app-ds-filter-panel` | Filter controls for tables/lists, chips, apply/clear flows. | Assert apply/clear callbacks and disabled-apply state. Use realistic filter configs. | `src/stories/components/filter-panel/filter-panel.stories.ts` |
| Full Page Layout | story mock only | Storybook documentation/demo layout. | Not a production design-system component folder for audit purposes. Avoid treating it as reusable API. | `src/stories/components/ds-full-page-layout/ds-full-page-layout.stories.ts` |
| Icon | `app-ds-icon` | Unified FontAwesome/ng-icons/SVG icon rendering. | Pass FontAwesome definitions as objects, not string names. Use `cssClass` for color. | `src/stories/components/ds-icon/ds-icon.stories.ts` |
| Icon Chooser | `app-ds-icon-chooser`, modal | Icon selection control and modal grid. | Use valid names from icon chooser constants. Fake `ModalController` only when testing compact CVA path. | source-only: `src/app/design-system/icon-chooser` |
| Icon Container | `ds-icon-container` | Icon plus optional chip, menu, label, indicator. | Use config object. `menu` and `hasIndicator` are mutually exclusive behavior patterns. | `src/stories/components/ds-icon-container/ds-icon-container.stories.ts` |
| In-App Notification | `ds-app-notification-container`, `app-in-app-notification-card` | Notification stack, dismiss, navigation/error fallback. | Use realistic `NotificationService` contract fakes; assert show/dismiss and callback behavior. | `src/stories/components/in-app-notification/in-app-notification.stories.ts` |
| Input | `app-ds-input` | Single-line text/password/number entry with labels, hints, errors, icons. | Use reactive forms. Use `iconEndClick` for password toggles. Avoid duplicate form error and `errorMessage`. | `src/stories/components/ds-input/ds-input.stories.ts` |
| Journal Feed | `ds-journal-feed` and journal cards | Journal timeline/feed cards, mobile cards, read-only empty state. | Fake navigation/dialog/layout dependencies locally; assert click/read-only behavior. | `src/stories/components/journal-feed/journal-feed.stories.ts` |
| Modal | `ds-modal`, `DsModalService`, wrapper/header/footer | Modal shell and service-backed dialogs. | `ds-modal` is inner shell. Use `DsModalService.open()` for service contract stories. Mobile becomes bottom sheet. | `src/stories/components/ds-modal/ds-modal.stories.ts` |
| Modal Sheet | `ds-modal-sheet-container`, `ModalSheetService` | Custom stacked sheet system. | Must call `ModalSheetService.present()` to validate behavior. Distinct from `DsModalService`. | `src/stories/components/ds-modal-sheet/ds-modal-sheet.stories.ts` |
| Option Creator | `ds-select-option-creator`, item | Create/edit MCQ, multiple-select, true/false answer options. | Use reactive forms and wait for 500ms debounce on `optionsChange`. | source-only: `src/app/design-system/option-creator` |
| Picker Select | `app-ds-picker-select` | Modal picker-style single/multi selection. | Open through `DsModalService`. Config object is required. Mobile branch comes from modal service. | `src/stories/components/ds-picker-select/ds-picker-select.stories.ts` |
| Popup Menu | `ds-menu`, `ds-submenu`, `ds-responsive-menu` | Menu actions, nested actions, responsive action menus. | Desktop overlay and mobile sheet paths differ. Avoid ambiguous nested button role queries in tests. | `src/stories/components/ds-popup/ds-popup.stories.ts` |
| Progress Bar | `app-ds-progress-bar` | Animated 0-100 progress. | Values clamp to 0-100. RTL reverses fill direction. Use semantic variant names. | `src/stories/components/ds-progress-bar/ds-progress-bar.stories.ts` |
| QR Scanner | `ds-qr-scanner`, modal, service | QR camera scanning and modal wrapper. | Do not trigger real camera in Storybook. Use camera-safe ready/error harnesses. | source-only: `src/app/design-system/qr-scanner` |
| Radio Button | `app-ds-radio` | Single radio atom inside or outside radio group. | Use CVA/FormControl for checked/disabled stories. Do not use for multi-select. | `src/stories/components/ds-radio-button/ds-radio-button.stories.ts` |
| Radio Group | `app-ds-radio-group` | Mutually exclusive options. | Use `FormControl`; disabled child must not become selected. Group propagates selected value. | `src/stories/components/ds-radio-group/ds-radio-group.stories.ts` |
| React/Reactions | `ds-react`, `[Reactions]` directive | Reaction counts, user reaction, reaction details tooltip/bottom sheet. | Fake `AuthService` and modal details service. Mobile details open as bottom sheet. | source-only: `src/app/design-system/react` |
| School Structure Control | `app-ds-school-structure-control`, tree, trigger, modal/sheet | Company/campus/school/level/class scoped selection. | Fake API/scope services with nested fixtures. Desktop modal and mobile sheet differ. | source-only: `src/app/design-system/school-structure-control` |
| Search Box | `app-search-box` | Debounced search with optional add/cancel buttons. | Not a CVA. Emits `(searchChange)`. Mobile focus can hide bottom bar. | `src/stories/components/ds-search-box/ds-search-box.stories.ts` |
| Segmented Control | `ds-segmented-control` | Compact tab-like single selection. | Role is `tablist`/`tab`; disabled option should be disabled and inert. | `src/stories/components/ds-segmented-control/ds-segmented-control.stories.ts` |
| Select | `app-ds-select` | Dropdown/modal select, search, async/paginated options, chips. | `[config]` is required. Desktop CDK overlay, mobile IonModal sheet. Do not mutate options in place. | `src/stories/components/ds-select/ds-select.stories.ts` |
| Selectable Option | `ds-selectable-option`, `app-ds-selectable-option-group` | Assessment answer option display/selection. | Group CVA disabled state is limited; do not promise disabled group behavior unless source changes. | source-only: `src/app/design-system/selectable-option` |
| Sidebar | `ds-sidebar`, `DsSidebarService` | Desktop side panel and mobile sidebar sheet. | Service chooses desktop sidebar vs mobile bottom sheet/modal-sheet. Test both. | `src/stories/components/ds-sidebar/ds-sidebar.stories.ts` |
| Student Selector | `app-ds-student-selector` | Select current/all/specific students with statuses. | Use realistic student fixtures and layout branch fakes; cover mobile/read-only/empty state. | `src/stories/components/student-selector/student-selector.stories.ts` |
| Switch | `app-ds-switch` | Boolean toggle or two-way option switch. | Use for binary on/off, not larger option sets. Bind through FormControl when part of forms. | `src/stories/components/ds-switch/ds-switch.stories.ts` |
| Tabs | `app-ds-tabs`, `ds-tabs-with-swipe` | Section tabs, badges, scrollable overflow. | Needs `DS_TRANSLATION_TOKEN`. Swipe support is in sibling component, not base tabs. | `src/stories/components/ds-tabs/ds-tabs.stories.ts` |
| Text Area | `app-ds-textarea` | Multi-line text with label, hints, char count, validators. | Use for multi-line only. `rows` and `maxLength` are classic inputs. Use real validators for errors. | `src/stories/components/ds-textarea/ds-textarea.stories.ts` |
| Time Picker | `ds-time-picker`, `ds-time-picker-control` | 12-hour time selection with minute steps and RTL order. | Emits canonical `HH:MM AM/PM`. Disabled input is not visibly wired in the base picker yet. | `src/stories/components/ds-time-picker/ds-time-picker.stories.ts` |
| Toast | `[ds-toast-component]`, story wrapper/service path | Toast notifications and toaster service behavior. | Use toaster mock/provider for Storybook. Assert show/dismiss behavior through service path. | `src/stories/components/ds-toast/ds-toast.stories.ts` |
| Tooltip | `[dsTooltip]`, `ds-tooltip-panel`, `ds-tooltip-default` | Hover/focus contextual help via CDK overlay. | Wait for overlay delay; assert overlay in `document.body`, not only story root. | `src/stories/components/ds-tooltip/ds-tooltip.stories.ts` |

## Storybook Story Requirements By State

Use these states when the production component supports them:

| State | What to assert |
| --- | --- |
| Default | Component renders with production tokens and required inputs. |
| LTR | English text, `dir="ltr"`, Nunito font context. |
| RTL | Arabic text, `dir="rtl" lang="ar"`, logical spacing and icon direction. |
| Student role | Ancestor `data-role="student"` changes the supported component style. |
| Disabled | Native/control disabled state blocks interaction, not just opacity. |
| Loading | Loading UI appears and action is blocked. |
| Error/required | Real form validator or service error path drives visible state. |
| Empty/no data | Real empty-state API/config renders, not fake placeholder text. |
| Service contract | Real service method or realistic local fake opens/dismisses/returns data. |
| Mobile branch | Platform/layout fake triggers mobile implementation path. |
| Desktop branch | Platform/layout fake triggers desktop implementation path. |

## Verification Commands

Run after documentation or story changes:

```bash
npm run storybook:audit
npx tsc -p .storybook/tsconfig.json --noEmit
npm run build-storybook
```

Known baseline warnings may appear during `build-storybook`:

- duplicate Tailwind keys in `tailwind.config.js`
- broad Angular tsconfig unused-file warnings
- asset and entrypoint size warnings

Treat new TypeScript errors, audit regressions, missing providers, missing stories,
and failed build exits as blockers.
