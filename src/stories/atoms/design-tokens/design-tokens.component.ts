import { Component, ElementRef, ViewChild, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ColorSwatch {
  name: string;
  cssVar: string;
  hex?: string;
}

interface ColorGroup {
  groupName: string;
  description: string;
  swatches: ColorSwatch[];
}

@Component({
  selector: 'app-design-tokens',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container style="font-family: var(--ion-font-family, Nunito, sans-serif); padding: 2rem; max-width: 100%;">

      <!-- Section Nav -->
      <nav style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 2rem;">
        <a href="#colors" style="padding: 6px 12px; background: #fed143; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; color: #3d3007;">Colors</a>
        <a href="#spacing" style="padding: 6px 12px; background: #f3f4f6; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; color: #374151;">Spacing</a>
        <a href="#icons" style="padding: 6px 12px; background: #f3f4f6; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; color: #374151;">Icons ({{ iconNames.length }})</a>
      </nav>

      <!-- Color Palette -->
      <section id="colors" style="margin-bottom: 3rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">Color Palette</h2>
        <p style="font-size: 13px; color: #6b7280; margin-bottom: 1.5rem;">380+ CSS custom properties. Brand primary = <code style="background: #fef9c3; padding: 2px 4px; border-radius: 3px;">#fed143</code>. Hover a swatch to see the computed hex value.</p>

        <div *ngFor="let group of colorGroups" style="margin-bottom: 2rem;">
          <div style="display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 0.75rem;">
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin: 0;">{{ group.groupName }}</h3>
            <span style="font-size: 12px; color: #9ca3af;">{{ group.description }}</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <div *ngFor="let swatch of group.swatches"
                 style="display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer;"
                 [title]="swatch.cssVar">
              <div style="width: 40px; height: 40px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.08);"
                   [style.background]="'var(' + swatch.cssVar + ')'">
              </div>
              <span style="font-size: 9px; color: #9ca3af; max-width: 44px; text-align: center; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">{{ swatch.name }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Semantic Tokens -->
      <section style="margin-bottom: 3rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">Semantic Tokens</h2>
        <p style="font-size: 13px; color: #6b7280; margin-bottom: 1.5rem;">Purpose-named tokens that map to primitives. Use these in components — never reference primitives directly.</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
          <div *ngFor="let s of semanticTokens" style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0; border: 1px solid rgba(0,0,0,0.08);"
                 [style.background]="'var(' + s.cssVar + ')'">
            </div>
            <div>
              <code style="font-size: 10px; color: #7c3aed; display: block;">{{ s.cssVar }}</code>
              <span style="font-size: 11px; color: #6b7280;">{{ s.name }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Spacing Ruler -->
      <section id="spacing" style="margin-bottom: 3rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">Spacing Scale</h2>
        <p style="font-size: 13px; color: #6b7280; margin-bottom: 1.5rem;">All spacing tokens are self-responsive. Use <code>var(--ds-spacing-*)</code> for padding/margin, <code>var(--ds-gaps-*)</code> for flex/grid gaps.</p>
        <div style="display: flex; flex-direction: column; gap: 10px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem;">
          <div *ngFor="let t of allSpacingTokens" style="display: grid; grid-template-columns: 80px 160px 1fr; align-items: center; gap: 12px;">
            <code style="font-size: 11px; color: #7c3aed;">{{ t.token }}</code>
            <span style="font-size: 11px; color: #9ca3af;">{{ t.mobile }} / {{ t.tablet }} / {{ t.desktop }}</span>
            <div [style.height]="'var(' + t.cssVar + ')'" style="width: 100%; max-width: 320px; background: #fed143; border-radius: 2px; min-height: 2px;"></div>
          </div>
        </div>
      </section>

      <!-- Icon Grid -->
      <section id="icons">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">Icons ({{ iconNames.length }})</h2>
        <p style="font-size: 13px; color: #6b7280; margin-bottom: 1.5rem;">Custom SVG assets at <code>src/assets/icons/*.svg</code>. Use via <code>&lt;app-ds-icon [icon]="'icon-name.svg'"&gt;</code>.</p>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          <div *ngFor="let icon of iconNames"
               style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; width: 80px; cursor: pointer;"
               [title]="icon + '.svg'">
            <img [src]="'assets/icons/' + icon + '.svg'" [alt]="icon"
                 style="width: 24px; height: 24px; object-fit: contain;"
                 onerror="this.style.display='none'">
            <span style="font-size: 9px; color: #9ca3af; text-align: center; word-break: break-word; max-width: 72px;">{{ icon }}</span>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class DesignTokensComponent {
  colorGroups: ColorGroup[] = [
    {
      groupName: 'Brand',
      description: 'Primary brand color — yellow (#fed143)',
      swatches: [
        { name: '50', cssVar: '--colors-brand-50' },
        { name: '100', cssVar: '--colors-brand-100' },
        { name: '200', cssVar: '--colors-brand-200' },
        { name: '300', cssVar: '--colors-brand-300' },
        { name: '400', cssVar: '--colors-brand-400' },
        { name: '500', cssVar: '--colors-brand-500' },
        { name: '600', cssVar: '--colors-brand-600' },
        { name: '700', cssVar: '--colors-brand-700' },
        { name: '800', cssVar: '--colors-brand-800' },
        { name: '900', cssVar: '--colors-brand-900' },
        { name: '950', cssVar: '--colors-brand-950' },
      ],
    },
    {
      groupName: 'Neutral Cool',
      description: 'Grays for text, borders, surfaces',
      swatches: [
        { name: '50', cssVar: '--colors-neutral-cool-50' },
        { name: '100', cssVar: '--colors-neutral-cool-100' },
        { name: '200', cssVar: '--colors-neutral-cool-200' },
        { name: '300', cssVar: '--colors-neutral-cool-300' },
        { name: '400', cssVar: '--colors-neutral-cool-400' },
        { name: '500', cssVar: '--colors-neutral-cool-500' },
        { name: '600', cssVar: '--colors-neutral-cool-600' },
        { name: '700', cssVar: '--colors-neutral-cool-700' },
        { name: '800', cssVar: '--colors-neutral-cool-800' },
        { name: '900', cssVar: '--colors-neutral-cool-900' },
      ],
    },
    {
      groupName: 'Error Red',
      description: 'Danger & error states',
      swatches: [
        { name: '50', cssVar: '--colors-error-red-50' },
        { name: '100', cssVar: '--colors-error-red-100' },
        { name: '200', cssVar: '--colors-error-red-200' },
        { name: '300', cssVar: '--colors-error-red-300' },
        { name: '400', cssVar: '--colors-error-red-400' },
        { name: '500', cssVar: '--colors-error-red-500' },
        { name: '600', cssVar: '--colors-error-red-600' },
      ],
    },
    {
      groupName: 'Emerald',
      description: 'Success states',
      swatches: [
        { name: '50', cssVar: '--colors-emerald-50' },
        { name: '100', cssVar: '--colors-emerald-100' },
        { name: '300', cssVar: '--colors-emerald-300' },
        { name: '500', cssVar: '--colors-emerald-500' },
        { name: '600', cssVar: '--colors-emerald-600' },
        { name: '800', cssVar: '--colors-emerald-800' },
      ],
    },
    {
      groupName: 'Warn Orange',
      description: 'Warning states',
      swatches: [
        { name: '50', cssVar: '--colors-warn-orange-50' },
        { name: '300', cssVar: '--colors-warn-orange-300' },
        { name: '400', cssVar: '--colors-warn-orange-400' },
        { name: '500', cssVar: '--colors-warn-orange-500' },
        { name: '600', cssVar: '--colors-warn-orange-600' },
        { name: '700', cssVar: '--colors-warn-orange-700' },
      ],
    },
    {
      groupName: 'Blue',
      description: 'Information',
      swatches: [
        { name: '50', cssVar: '--colors-blue-50' },
        { name: '100', cssVar: '--colors-blue-100' },
        { name: '400', cssVar: '--colors-blue-400' },
        { name: '500', cssVar: '--colors-blue-500' },
        { name: '600', cssVar: '--colors-blue-600' },
        { name: '900', cssVar: '--colors-blue-900' },
      ],
    },
    {
      groupName: 'Indigo',
      description: 'Exciting / premium',
      swatches: [
        { name: '50', cssVar: '--colors-indigo-50' },
        { name: '200', cssVar: '--colors-indigo-200' },
        { name: '400', cssVar: '--colors-indigo-400' },
        { name: '600', cssVar: '--colors-indigo-600' },
        { name: '800', cssVar: '--colors-indigo-800' },
      ],
    },
    {
      groupName: 'Coral',
      description: 'Accent',
      swatches: [
        { name: '50', cssVar: '--colors-coral-50' },
        { name: '100', cssVar: '--colors-coral-100' },
        { name: '300', cssVar: '--colors-coral-300' },
        { name: '500', cssVar: '--colors-coral-500' },
        { name: '700', cssVar: '--colors-coral-700' },
      ],
    },
    {
      groupName: 'Teal',
      description: 'Accent',
      swatches: [
        { name: '50', cssVar: '--colors-teal-50' },
        { name: '100', cssVar: '--colors-teal-100' },
        { name: '200', cssVar: '--colors-teal-200' },
        { name: '400', cssVar: '--colors-teal-400' },
        { name: '600', cssVar: '--colors-teal-600' },
      ],
    },
    {
      groupName: 'Purple',
      description: 'Accent',
      swatches: [
        { name: '50', cssVar: '--colors-purple-50' },
        { name: '100', cssVar: '--colors-purple-100' },
        { name: '200', cssVar: '--colors-purple-200' },
        { name: '500', cssVar: '--colors-purple-500' },
        { name: '700', cssVar: '--colors-purple-700' },
      ],
    },
  ];

  semanticTokens = [
    { name: 'Action content', cssVar: '--content-action' },
    { name: 'High emphasis', cssVar: '--content-high-emphasis' },
    { name: 'Mid emphasis', cssVar: '--content-mid-emphasis' },
    { name: 'Low emphasis', cssVar: '--content-low-emphasis' },
    { name: 'Error content', cssVar: '--content-error' },
    { name: 'Success content', cssVar: '--content-success' },
    { name: 'Warning content', cssVar: '--content-warning' },
    { name: 'Information', cssVar: '--content-information' },
    { name: 'Brand surface', cssVar: '--surface-brand-default' },
    { name: 'Brand subtle', cssVar: '--surface-brand-subtle' },
    { name: 'Action surface', cssVar: '--surface-action' },
    { name: 'Danger surface', cssVar: '--f-surface-danger' },
    { name: 'Success surface', cssVar: '--f-surface-positive' },
    { name: 'Warning surface', cssVar: '--f-surface-warn' },
    { name: 'Info surface', cssVar: '--f-surface-info' },
    { name: 'High stroke', cssVar: '--stroke-color-high-emphasis' },
    { name: 'Mid stroke', cssVar: '--stroke-color-mid-emphasis' },
    { name: 'Brand stroke', cssVar: '--stroke-color-brand-default' },
    { name: 'Error stroke', cssVar: '--stroke-color-error-default' },
    { name: 'Success stroke', cssVar: '--stroke-color-success-default' },
  ];

  allSpacingTokens = [
    { token: 'spacing-xs', cssVar: '--ds-spacing-xs', mobile: '2px', tablet: '2px', desktop: '4px' },
    { token: 'spacing-sm', cssVar: '--ds-spacing-sm', mobile: '4px', tablet: '6px', desktop: '8px' },
    { token: 'spacing-md', cssVar: '--ds-spacing-md', mobile: '8px', tablet: '10px', desktop: '12px' },
    { token: 'spacing-lg', cssVar: '--ds-spacing-lg', mobile: '12px', tablet: '16px', desktop: '18px' },
    { token: 'spacing-xl', cssVar: '--ds-spacing-xl', mobile: '16px', tablet: '20px', desktop: '24px' },
    { token: 'spacing-2xl', cssVar: '--ds-spacing-2xl', mobile: '20px', tablet: '24px', desktop: '32px' },
    { token: 'gaps-xs', cssVar: '--ds-gaps-xs', mobile: '2px', tablet: '4px', desktop: '4px' },
    { token: 'gaps-sm', cssVar: '--ds-gaps-sm', mobile: '4px', tablet: '6px', desktop: '8px' },
    { token: 'gaps-md', cssVar: '--ds-gaps-md', mobile: '8px', tablet: '10px', desktop: '12px' },
    { token: 'gaps-lg', cssVar: '--ds-gaps-lg', mobile: '12px', tablet: '14px', desktop: '16px' },
    { token: 'gaps-xl', cssVar: '--ds-gaps-xl', mobile: '16px', tablet: '18px', desktop: '20px' },
    { token: 'gaps-2xl', cssVar: '--ds-gaps-2xl', mobile: '20px', tablet: '24px', desktop: '28px' },
    { token: 'gaps-3xl', cssVar: '--ds-gaps-3xl', mobile: '24px', tablet: '28px', desktop: '32px' },
  ];

  iconNames = [
    'academic-enrollment', 'academic-year', 'academic', 'add-with-border', 'announcement-solid', 'announcements',
    'attachments', 'attendance-excused', 'attendance-late', 'attendance-planned', 'attendance-unplanned', 'attendance',
    'back', 'book-edit', 'calender-placeholder', 'call', 'campus-duotone', 'campus', 'car', 'category-settings',
    'change-language', 'chart', 'chat', 'chevron-down', 'chevron-right', 'cil-applications-settings', 'clap-react',
    'class-duotone', 'class', 'clock', 'collapse', 'company-duotone', 'company', 'configure-escalation',
    'confused-react', 'correct-file', 'course', 'create-notification', 'create-post', 'create-sms',
    'ds-assignment', 'ds-attachment', 'ds-exam', 'ds-image', 'ds-ms-word', 'ds-no-data', 'ds-pdf', 'ds-quiz',
    'ds-video', 'ds-worksheet', 'exam', 'exciting', 'exclaimation-octagon', 'expand', 'export-colored', 'export',
    'feed', 'file', 'folder-outline', 'grade-management', 'grade-mgmt', 'grade-scale', 'heart-two-tone-sm',
    'heart-two-tone', 'heart', 'help&support', 'help', 'home', 'info-circle', 'insightful-react', 'journal',
    'journals-feed', 'journals', 'ksa-flag', 'language', 'level-duotone', 'level', 'like-react', 'location',
    'logout', 'loudspeaker', 'love-react', 'manage-announcements', 'manage-report-card', 'mascot-empty-todo',
    'maximize', 'menu', 'minus', 'no-search-result', 'open-book', 'organisation', 'pickup', 'picture', 'plane',
    'play', 'pray-react', 'preview', 'profile-2user', 'profile', 'react-button', 'report-cards', 'report-entries',
    'report', 'roles', 'routing', 'school-duotone-lg', 'school-duotone', 'school-structure', 'school', 'score',
    'score-good-try', 'score-needs-practice', 'score-needs-support', 'score-perfect', 'score-very-good',
    'semester', 'settings', 'star-journals-new-feed', 'star-regular', 'star-solid', 'strong-react', 'structure',
    'sub-company-duotone', 'sub-company', 'subject-default', 'subjects', 'support-setting', 'support-tickets',
    'support', 'task-square', 'ticket-discount', 'ticket', 'time-period', 'timetable', 'user-clock', 'user-colored',
    'user-group', 'user-management', 'user-minus', 'user-remove', 'user-tick', 'user-times-solid', 'user',
    'vcr', 'video-square', 'video', 'warning-icon', 'warning',
  ];
}
