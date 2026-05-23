import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';

/**
 * @ai-hint
 * component: DsTooltipDefaultComponent
 * selector: ds-tooltip-default
 * intent: Standard tooltip content panel with an optional icon, title, body text, and footer line; used as the projected content inside DsTooltipDirective overlays
 * do: Use alongside DsTooltipDirective — pass this component as the tooltip content; supply title for a bold heading, content for the main body, and footer for a right-aligned supplemental note; pass icon to prefix the content with a contextual icon
 * dont: Don't render this component standalone outside a tooltip overlay — it has no positioning or trigger logic; don't omit all three text inputs (title, content, footer) as the tooltip will be empty
 * device: No structural device differences; tooltip positioning is handled by the directive/overlay, not this component
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Footer text is right-aligned via flex justify-end; overall layout inherits host direction
 * alternatives: Custom component passed to DsTooltipDirective for richer tooltip content beyond text
 */
@Component({
  selector: 'ds-tooltip-default',
  standalone: true,
  imports: [DsIconComponent, CommonModule],
  template: `
    <div class="flex items-start gap-ds-sm text-content-high-inverse">
      @if (icon) {
        <app-ds-icon
          [icon]="icon"
          [size]="iconSize || 20"
          [cssClass]="iconClass"
        />
      }
      <div class="flex flex-col gap-ds-sm">
        @if (title) {
          <div class="ds-tooltip-title mb-1 flex items-center gap-2">
            <span class="single-line-xs-high-emphasis">{{ title }}</span>
          </div>
        }
        @if (content) {
          <div class="content-xs-default">{{ content }}</div>
        }
        @if (footer) {
          <div class="content-xs-default flex justify-end">{{ footer }}</div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsTooltipDefaultComponent {
  @Input() title?: string;
  @Input() content?: string;
  @Input() footer?: string;
  @Input() icon?: DsIcon;
  @Input() iconClass?: string;
  @Input() iconSize?: string | number;
}
