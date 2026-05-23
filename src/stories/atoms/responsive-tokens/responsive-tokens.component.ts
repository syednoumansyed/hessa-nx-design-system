import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TokenRow {
  name: string;
  cssVar: string;
  mobile: string;
  tablet: string;
  desktop: string;
}

interface TypographyRow {
  cssVar: string;
  lineHeightVar: string;
  sample: string;
  mobile: string;
  tablet: string;
  desktop: string;
}

@Component({
  selector: 'app-responsive-tokens',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="font-family: var(--ion-font-family, Nunito, sans-serif); padding: 2rem; max-width: 100%;">

      <!-- Hero: Live Typography Scale -->
      <section style="margin-bottom: 3rem;">
        <h2 style="font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 0.5rem;">
          Typography Scale — Resize viewport to see tokens adapt
        </h2>
        <p style="font-size: 12px; color: #9ca3af; margin: 0 0 1rem;">
          Mobile default &nbsp;·&nbsp;
          <span style="color: #3b82f6;">Tablet ≥ 768px</span> &nbsp;·&nbsp;
          <span style="color: #8b5cf6;">Desktop ≥ 1024px</span>
          &nbsp;— typography switches at <strong>1024px</strong>, not 1280px
        </p>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem;">
          <div *ngFor="let t of typographyTokens" style="display: grid; grid-template-columns: 140px 1fr 200px; align-items: center; gap: 1rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.5rem;">
            <code style="font-size: 11px; color: #9ca3af; background: #f9fafb; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">{{ t.cssVar }}</code>
            <span [style.font-size]="'var(' + t.cssVar + ')'" [style.line-height]="'var(' + t.lineHeightVar + ')'">
              {{ t.sample }}
            </span>
            <span style="font-size: 11px; color: #9ca3af; white-space: nowrap;">
              <span style="color: #6b7280;">{{ t.mobile }}</span>
              <span style="margin: 0 4px;">→</span>
              <span style="color: #3b82f6;">{{ t.tablet }}</span>
              <span style="margin: 0 4px;">→</span>
              <span style="color: #8b5cf6;">{{ t.desktop }}</span>
            </span>
          </div>
        </div>
      </section>

      <!-- Spacing Scale Ruler -->
      <section style="margin-bottom: 3rem;">
        <h2 style="font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 1.5rem;">
          Spacing Scale — var(--ds-spacing-*)
        </h2>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="text-align: left; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 8px 12px; color: #374151; font-weight: 600;">Token</th>
                <th style="padding: 8px 12px; color: #374151; font-weight: 600;">CSS Variable</th>
                <th style="padding: 8px 12px; color: #6b7280;">Mobile</th>
                <th style="padding: 8px 12px; color: #3b82f6;">Tablet (768px+)</th>
                <th style="padding: 8px 12px; color: #8b5cf6;">Desktop ≥ 1280px</th>
                <th style="padding: 8px 12px; color: #374151;">Live Preview</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of spacingTokens; let i = index" [style.background]="i % 2 === 0 ? '#fafafa' : 'white'">
                <td style="padding: 8px 12px; font-weight: 500;">{{ t.name }}</td>
                <td style="padding: 8px 12px;"><code style="font-size: 11px; color: #7c3aed; background: #f5f3ff; padding: 2px 6px; border-radius: 4px;">{{ t.cssVar }}</code></td>
                <td style="padding: 8px 12px; color: #6b7280;">{{ t.mobile }}</td>
                <td style="padding: 8px 12px; color: #3b82f6;">{{ t.tablet }}</td>
                <td style="padding: 8px 12px; color: #8b5cf6;">{{ t.desktop }}</td>
                <td style="padding: 8px 12px;">
                  <div [style.width]="'var(' + t.cssVar + ')'" style="height: 16px; background: #fed143; border-radius: 2px; min-width: 2px;"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Gap Scale -->
      <section style="margin-bottom: 3rem;">
        <h2 style="font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 1.5rem;">
          Gap Scale — var(--ds-gaps-*)
        </h2>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="text-align: left; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 8px 12px; color: #374151; font-weight: 600;">Token</th>
                <th style="padding: 8px 12px; color: #374151; font-weight: 600;">CSS Variable</th>
                <th style="padding: 8px 12px; color: #6b7280;">Mobile</th>
                <th style="padding: 8px 12px; color: #3b82f6;">Tablet</th>
                <th style="padding: 8px 12px; color: #8b5cf6;">Desktop</th>
                <th style="padding: 8px 12px; color: #374151;">Live Preview</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of gapTokens; let i = index" [style.background]="i % 2 === 0 ? '#fafafa' : 'white'">
                <td style="padding: 8px 12px; font-weight: 500;">{{ t.name }}</td>
                <td style="padding: 8px 12px;"><code style="font-size: 11px; color: #7c3aed; background: #f5f3ff; padding: 2px 6px; border-radius: 4px;">{{ t.cssVar }}</code></td>
                <td style="padding: 8px 12px; color: #6b7280;">{{ t.mobile }}</td>
                <td style="padding: 8px 12px; color: #3b82f6;">{{ t.tablet }}</td>
                <td style="padding: 8px 12px; color: #8b5cf6;">{{ t.desktop }}</td>
                <td style="padding: 8px 12px;">
                  <div style="display: flex; align-items: center; gap: 0; background: #e5e7eb; height: 16px; border-radius: 2px;">
                    <div [style.width]="'var(' + t.cssVar + ')'" style="height: 16px; background: #3b82f6; min-width: 2px; border-radius: 2px;"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Corner Radius Scale -->
      <section style="margin-bottom: 3rem;">
        <h2 style="font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 1.5rem;">
          Corner Radius — var(--ds-corner-radius-*)
        </h2>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem;">
          <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-end;">
            <div *ngFor="let t of cornerRadiusTokens" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
              <div style="width: 48px; height: 48px; background: #fed143; border: 2px solid #d2a61b;"
                   [style.border-radius]="'var(' + t.cssVar + ')'">
              </div>
              <code style="font-size: 10px; color: #7c3aed; text-align: center;">{{ t.name }}</code>
              <span style="font-size: 10px; color: #9ca3af;">{{ t.mobile }}/{{ t.desktop }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Role Tokens -->
      <section style="margin-bottom: 3rem;">
        <h2 style="font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 0.5rem;">
          Role Tokens — Teacher (Personnel) vs Student
        </h2>
        <p style="font-size: 12px; color: #9ca3af; margin: 0 0 1rem;">
          Use the <strong>Role</strong> toolbar above to switch between Teacher and Student context.
        </p>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; background: #fafafa;">
          <div style="display: flex; gap: 1rem; align-items: flex-start; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 260px; background: white; border-radius: 10px; padding: 1rem; border: 1px solid #e5e7eb;">
              <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Current state</div>
              <ul style="margin: 0; padding: 0 0 0 1rem; font-size: 13px; color: #374151; line-height: 1.8;">
                <li><code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;">data-role</code> attribute is set on <code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;">&lt;html&gt;</code> by <strong>ThemeManagerService</strong></li>
                <li>No CSS <code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;">:root[data-role="student"]</code> token overrides exist yet</li>
                <li>Role differences today are <strong>component-level Tailwind classes</strong>, not token-level</li>
              </ul>
            </div>
            <div style="flex: 1; min-width: 260px; background: #fffbee; border-radius: 10px; padding: 1rem; border: 1px dashed #fed143;">
              <div style="font-size: 12px; font-weight: 600; color: #92400e; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Components with student theme today</div>
              <ul style="margin: 0; padding: 0 0 0 1rem; font-size: 13px; color: #374151; line-height: 1.8;">
                <li><strong>ds-button</strong> — raised 3D bottom border + press animation</li>
                <li><strong>ds-input</strong> — thick bottom-heavy "tray" border</li>
                <li><strong>ds-picker-select</strong> — same tray border as input</li>
                <li><strong>ds-textarea</strong> — same tray border as input</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Code Usage -->
      <section>
        <h2 style="font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 1rem;">
          How to Use
        </h2>
        <pre style="background: #1e293b; color: #e2e8f0; padding: 1.5rem; border-radius: 12px; font-size: 13px; overflow-x: auto; line-height: 1.6;">/* CSS — tokens redefine themselves at each breakpoint */
.my-component {{ '{' }}
  padding: var(--ds-spacing-md);        /* 8px → 10px → 12px */
  gap: var(--ds-gaps-sm);              /* 4px → 6px → 8px */
  border-radius: var(--ds-corner-radius-lg);  /* 12px → 12px → 16px */
  font-size: var(--font-size-lg);       /* 16px → 18px → 20px */
{{ '}' }}

/* SCSS shorthand classes (compiled) */
.p-ds-md    {{ '{' }} padding: var(--ds-spacing-md) {{ '}' }}
.gap-ds-sm  {{ '{' }} gap: var(--ds-gaps-sm) {{ '}' }}
.rounded-ds-lg {{ '{' }} border-radius: var(--ds-corner-radius-lg) {{ '}' }}</pre>
      </section>
    </div>
  `,
})
export class ResponsiveTokensComponent {
  typographyTokens: TypographyRow[] = [
    { cssVar: '--font-size-xs',   lineHeightVar: '--font-line-height-xs',   sample: 'The quick brown fox — xs',   mobile: '12px', tablet: '12px', desktop: '12px' },
    { cssVar: '--font-size-sm',   lineHeightVar: '--font-line-height-sm',   sample: 'The quick brown fox — sm',   mobile: '12px', tablet: '14px', desktop: '14px' },
    { cssVar: '--font-size-base', lineHeightVar: '--font-line-height-base', sample: 'The quick brown fox — base', mobile: '14px', tablet: '16px', desktop: '16px' },
    { cssVar: '--font-size-lg',   lineHeightVar: '--font-line-height-lg',   sample: 'The quick brown fox — lg',   mobile: '16px', tablet: '18px', desktop: '20px' },
    { cssVar: '--font-size-xl',   lineHeightVar: '--font-line-height-xl',   sample: 'The quick brown fox — xl',   mobile: '18px', tablet: '20px', desktop: '24px' },
    { cssVar: '--font-size-2xl',  lineHeightVar: '--font-line-height-2xl',  sample: 'The quick brown fox — 2xl',  mobile: '20px', tablet: '24px', desktop: '30px' },
    { cssVar: '--font-size-3xl',  lineHeightVar: '--font-line-height-3xl',  sample: 'Quick fox — 3xl',            mobile: '30px', tablet: '36px', desktop: '48px' },
    { cssVar: '--font-size-4xl',  lineHeightVar: '--font-line-height-4xl',  sample: 'Fox — 4xl',                  mobile: '36px', tablet: '36px', desktop: '96px' },
  ];

  spacingTokens: TokenRow[] = [
    { name: 'xs', cssVar: '--ds-spacing-xs', mobile: '2px', tablet: '2px', desktop: '4px' },
    { name: 'sm', cssVar: '--ds-spacing-sm', mobile: '4px', tablet: '6px', desktop: '8px' },
    { name: 'md', cssVar: '--ds-spacing-md', mobile: '8px', tablet: '10px', desktop: '12px' },
    { name: 'lg', cssVar: '--ds-spacing-lg', mobile: '12px', tablet: '16px', desktop: '18px' },
    { name: 'xl', cssVar: '--ds-spacing-xl', mobile: '16px', tablet: '20px', desktop: '24px' },
    { name: '2xl', cssVar: '--ds-spacing-2xl', mobile: '20px', tablet: '24px', desktop: '32px' },
  ];

  gapTokens: TokenRow[] = [
    { name: 'xs', cssVar: '--ds-gaps-xs', mobile: '2px', tablet: '4px', desktop: '4px' },
    { name: 'sm', cssVar: '--ds-gaps-sm', mobile: '4px', tablet: '6px', desktop: '8px' },
    { name: 'md', cssVar: '--ds-gaps-md', mobile: '8px', tablet: '10px', desktop: '12px' },
    { name: 'lg', cssVar: '--ds-gaps-lg', mobile: '12px', tablet: '14px', desktop: '16px' },
    { name: 'xl', cssVar: '--ds-gaps-xl', mobile: '16px', tablet: '18px', desktop: '20px' },
    { name: '2xl', cssVar: '--ds-gaps-2xl', mobile: '20px', tablet: '24px', desktop: '28px' },
    { name: '3xl', cssVar: '--ds-gaps-3xl', mobile: '24px', tablet: '28px', desktop: '32px' },
  ];

  cornerRadiusTokens = [
    { name: 'xs', cssVar: '--ds-corner-radius-xs', mobile: '2px', desktop: '4px' },
    { name: 'sm', cssVar: '--ds-corner-radius-sm', mobile: '4px', desktop: '8px' },
    { name: 'md', cssVar: '--ds-corner-radius-md', mobile: '8px', desktop: '12px' },
    { name: 'lg', cssVar: '--ds-corner-radius-lg', mobile: '12px', desktop: '16px' },
    { name: 'xl', cssVar: '--ds-corner-radius-xl', mobile: '16px', desktop: '24px' },
    { name: '2xl', cssVar: '--ds-corner-radius-2xl', mobile: '24px', desktop: '32px' },
  ];
}
