import { Component, computed, input } from '@angular/core';
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleQuestion,
  faTriangleExclamation,
} from '@fortawesome/pro-regular-svg-icons';
import { NgClass } from '@angular/common';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';
import { DsFeedbackType } from './feedback.type';

/**
 * Feedback content component for displaying status messages with icons.
 * Used as the content inside modals opened via FeedbackService.
 *
 * Note: This component only renders the content (icon, title, message).
 * The modal header and footer buttons are handled by DsModalService.
 */
/**
 * @ai-hint
 * component: DsFeedbackComponent
 * selector: ds-feedback
 * intent: Content-only status illustration used inside feedback modals — renders a contextual icon, title, and message for error, warning, success, or question states
 * do: Instantiate via FeedbackService (not directly); supply type to get the correct icon and primary-button variant automatically; pass a custom icon input to override the default type icon
 * dont: Don't render standalone outside a modal shell — it has no backdrop or action buttons of its own; don't duplicate the primary button config here (FeedbackService owns that via getPrimaryButtonVariant)
 * device: No structural device differences
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Text and icon container use flex with gap; direction inherits from host
 * alternatives: DsAlertMessageComponent for inline (non-modal) status messages
 */
@Component({
  selector: 'ds-feedback',
  templateUrl: './feedback.component.html',
  standalone: true,
  imports: [NgClass, DsIconComponent],
})
export class DsFeedbackComponent {
  readonly type = input<DsFeedbackType>('error');
  readonly icon = input<DsIcon | undefined>(undefined);
  readonly title = input<string>('');
  readonly message = input<string | undefined>(undefined);

  /** Provided by DsModalService - function to close the modal */
  closeModal!: (data?: unknown, role?: string) => void;

  protected get iconType(): DsIcon {
    let defaultIcon: DsIcon = faCircleCheck;
    if (this.type() === 'error') defaultIcon = faCircleExclamation;
    else if (this.type() === 'warning') defaultIcon = faTriangleExclamation;
    else if (this.type() === 'question') defaultIcon = faCircleQuestion;
    if (this.icon()) {
      return this.icon() as DsIcon;
    } else {
      return defaultIcon;
    }
  }

  /**
   * Returns the appropriate button variant based on feedback type.
   * Used by FeedbackService to configure the primary button.
   */
  static getPrimaryButtonVariant(
    type: DsFeedbackType,
  ): 'primary' | 'dangerFill' {
    return type === 'error' ? 'dangerFill' : 'primary';
  }
}
