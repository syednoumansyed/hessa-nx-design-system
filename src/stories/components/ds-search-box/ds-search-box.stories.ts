import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { importProvidersFrom } from '@angular/core';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { SearchBoxComponent } from '@ds/search-box/search-box.component';
import { LayoutService } from '@layout/layout.service';

/**
 * # Search Box — `app-search-box`
 *
 * A composable search bar that includes:
 * - Debounced `searchChange` output (300 ms) with distinct-until-changed
 * - Optional **add button** (`includeAddButton`) — a tappable icon tile
 * - Optional **cancel button** (`includeCancelButton`) — text button for dismissal
 * - Two-way value sync via the `value` signal input
 * - `autoFocus` with configurable `autoFocusDelay`
 *
 * **LayoutService integration:** When `manageBottomBarVisibility=true` (default),
 * the component calls `LayoutService.updateBottomBarVisibility()` on focus/blur to
 * hide the app bottom navigation bar on mobile. In Storybook a mock `LayoutService`
 * is provided so these calls are no-ops.
 *
 * **Transloco:** The cancel button label is translated via `TranslocoDirective`
 * (`global.cancel.btn`). A `TranslocoTestingModule` with an inline translation map
 * is provided so the label renders correctly without the full app translation setup.
 */

/** Inline translation map used by TranslocoTestingModule in Storybook. */
const STORYBOOK_TRANSLATIONS = {
  en: { global: { 'cancel.btn': 'Cancel' } },
  ar: { global: { 'cancel.btn': 'إلغاء' } },
};

/** No-op mock for LayoutService — prevents injection errors in Storybook. */
const MockLayoutService = {
  updateBottomBarVisibility: (_visible: boolean) => {},
  hideBottomBar: () => {},
  showBottomBar: () => {},
};

const meta: Meta<SearchBoxComponent> = {
  title: '2. P1 Components/Search Box',
  component: SearchBoxComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    applicationConfig({
      providers: [
        provideIonicAngular(),
        importProvidersFrom(
          TranslocoTestingModule.forRoot({
            langs: STORYBOOK_TRANSLATIONS,
            translocoConfig: { defaultLang: 'en', availableLangs: ['en', 'ar'] },
            preloadLangs: true,
          }),
        ),
        { provide: LayoutService, useValue: MockLayoutService },
      ],
    }),
    moduleMetadata({ imports: [SearchBoxComponent] }),
  ],
};

export default meta;
type Story = StoryObj<SearchBoxComponent>;

/** Basic search field with a placeholder — type to emit `searchChange` events. */
export const Default: Story = {
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-search-box placeholderTxt="Search..." />
      </div>
    `,
  }),
};

/**
 * With add button — a branded tile appears to the right of the search input.
 * Emits `addButtonClick` when tapped.
 */
export const WithAddButton: Story = {
  name: 'With Add Button',
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-search-box placeholderTxt="Search students..." [includeAddButton]="true" />
      </div>
    `,
  }),
};

/**
 * With cancel button — a "Cancel" text button appears to the right.
 * Emits `cancelButtonClick` when tapped. Useful for search overlays.
 */
export const WithCancelButton: Story = {
  name: 'With Cancel Button',
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-search-box placeholderTxt="Search..." [includeCancelButton]="true" />
      </div>
    `,
  }),
};

/** Pre-filled value — simulates a search result already filtered. */
export const WithValue: Story = {
  name: 'With Value (pre-filled)',
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-search-box placeholderTxt="Search..." value="Ahmed" />
      </div>
    `,
  }),
};

/**
 * AutoFocus — the input is focused automatically after render.
 * Useful when the search box is the primary action on a page.
 */
export const AutoFocus: Story = {
  name: 'Auto Focus',
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-search-box placeholderTxt="Search..." [autoFocus]="true" />
      </div>
    `,
  }),
};

/**
 * Mobile Bottom Bar — when `manageBottomBarVisibility=true` (the default), the
 * component calls `LayoutService.updateBottomBarVisibility(false)` on input focus and
 * `updateBottomBarVisibility(true)` on blur, hiding the app's bottom navigation bar
 * while the keyboard is open.
 *
 * In this Storybook story a no-op mock `LayoutService` is provided. Open DevTools
 * console while interacting to observe the mock calls.
 */
export const MobileBehavior: Story = {
  name: 'Mobile Bottom Bar (mock LayoutService)',
  render: () => ({
    template: `
      <div style="max-width:375px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:#f9fafb;padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
          Simulated mobile viewport — focus the input to trigger bottom-bar logic
        </div>
        <div style="padding:16px;">
          <app-search-box
            placeholderTxt="Search..."
            [manageBottomBarVisibility]="true"
          />
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`manageBottomBarVisibility=true` (default) hides the app bottom navigation bar on mobile when the input is focused. A mock `LayoutService` is provided in Storybook — check the console to observe `updateBottomBarVisibility` calls.',
      },
    },
  },
};

/** LTR layout — English placeholder and cancel button. */
export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-search-box
          placeholderTxt="Search..."
          [includeAddButton]="true"
          [includeCancelButton]="true"
        />
      </div>
    `,
  }),
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          TranslocoTestingModule.forRoot({
            langs: STORYBOOK_TRANSLATIONS,
            translocoConfig: { defaultLang: 'en', availableLangs: ['en', 'ar'] },
            preloadLangs: true,
          }),
        ),
      ],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:32px;">${story}</div>`,
    ),
  ],
};

/** RTL layout — Arabic placeholder, cancel button renders in Arabic. */
export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <div style="max-width:480px;">
        <app-search-box
          placeholderTxt="بحث..."
          [includeAddButton]="true"
          [includeCancelButton]="true"
        />
      </div>
    `,
  }),
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(
          TranslocoTestingModule.forRoot({
            langs: STORYBOOK_TRANSLATIONS,
            translocoConfig: { defaultLang: 'ar', availableLangs: ['en', 'ar'] },
            preloadLangs: true,
          }),
        ),
      ],
    }),
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:32px;">${story}</div>`,
    ),
  ],
};
