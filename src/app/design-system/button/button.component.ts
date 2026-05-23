import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { provideNgIconsConfig } from '@ng-icons/core';
import { IonSpinner } from '@ionic/angular/standalone';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'dangerStroke'
  | 'dangerFill'
  | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * @ai-hint
 * component: DsButtonComponent
 * selector: ds-button
 * intent: Primary call-to-action, form submission, navigation trigger
 * do: Use variant="primary" for the main CTA; prefer ng-content for label text; use fullWidth for mobile stacked layouts
 * dont: Never place more than one primary button per view; don't use for toggle states; don't use title input as the sole label (it is a secondary hint)
 * device: No structural device differences; hover styles are md: prefixed (desktop only)
 * student-theme: YES — all sizes have student:border-b-[4px/6px] bottom border and active:border compensation for a 3D press effect
 * rtl: Fully supported — icon direction mirrors automatically via DsIconComponent
 * alternatives: DsChipComponent for filter toggles; variant="link" for inline text actions; DsSwitchComponent for on/off state
 */
@Component({
  selector: 'ds-button',
  templateUrl: './button.component.html',
  standalone: true,
  imports: [CommonModule, IonSpinner, DsIconComponent],
  providers: [
    provideNgIconsConfig({
      size: '24px',
    }),
  ],
})
export class DsButtonComponent {
  // Signal inputs
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('lg');
  loading = input(false);
  disabled = input(false);
  iconStart = input<DsIcon>();
  iconEnd = input<DsIcon>();
  type = input<'button' | 'submit' | 'reset'>('button');
  title = input('');
  fullWidth = input<boolean>(false);
  cssClass = input<string>('');

  // Computed icon size classes
  iconSizeClass = computed(() => {
    const sizeMap = {
      lg: '24px',
      md: '16px',
      sm: '16px',
    };
    return sizeMap[this.size()];
  });

  // Computed button classes
  buttonClasses = computed(() => {
    const baseClasses = [
      'flex items-center justify-center',
      'font-extrabold leading-none',
      'transition-colors duration-200',
      'border-2',
      'text-emphasis-high',
      ...(this.loading()
        ? ['disabled:!text-emphasis-high']
        : ['disabled:text-emphasis-low']),
    ];
    const sizeClasses = {
      sm: [
        'text-ds-base rounded-ds-md p-ds-md gap-1',
        'student:border-b-[4px]',
        'student:[&:not(:disabled)]:active:border-[3px] ',
        'student:[&:not(:disabled)]:active:px-[calc(var(--ds-spacing-md)-0.0625rem)]',
      ],
      md: [
        'rounded-ds-lg p-ds-md gap-2 text-ds-base',
        'student:border-b-[4px]',
        'student:[&:not(:disabled)]:active:border-[3px] ',
        'student:[&:not(:disabled)]:active:px-[calc(var(--ds-spacing-md)-0.0625rem)]',
      ],
      lg: [
        'rounded-ds-xl px-ds-xl py-ds-lg text-ds-lg gap-2',
        'student:border-[2px] student:border-b-[6px]',
        'student:[&:not(:disabled)]:active:border-[4px] ',
        'student:[&:not(:disabled)]:active:px-[calc(var(--ds-spacing-xl)-0.125rem)]',
      ],
    };
    const variantClasses = {
      primary: [
        'border-brand-200 bg-brand',
        'active:border-brand-600 active:bg-brand',
        'md:[&:not(:disabled)]:hover:border-brand-600 md:[&:not(:disabled)]:hover:bg-brand',
        'disabled:!border-brand-300 disabled:!bg-brand-100',
      ],
      secondary: [
        'border-brand-300 bg-surface-primary',
        'active:bg-brand-100 active:border-brand-600',
        'md:[&:not(:disabled)]:hover:bg-brand-100 md:[&:not(:disabled)]:hover:border-brand-300',
        'disabled:border-brand-300 disabled:bg-surface-primary',
      ],
      tertiary: [
        'border-indigo-200 bg-pastels-indigo-50',
        'active:bg-surface-primary active:border-indigo-400',
        'md:[&:not(:disabled)]:hover:bg-surface-primary md:[&:not(:disabled)]:hover:border-indigo-200',
        'disabled:border-indigo-50 disabled:bg-surface-primary',
      ],
      ghost: [
        'border-transparent bg-transparent',
        'active:bg-gray-200',
        'md:[&:not(:disabled)]:hover:bg-[var(--colors-pastels-neutral-gray-100)]',
        'disabled:bg-transparent',
      ],
      dangerStroke: [
        'border-error-ds-400  bg-error-ds-50 ',
        'active:bg-pastels-errorRed-200 active:border-error-ds-400',
        'md:[&:not(:disabled)]:hover:border-error-ds-400 md:[&:not(:disabled)]:hover:bg-pastels-errorRed-200',
        'disabled:bg-error-ds-50 disabled:border-error-ds-100',
      ],
      dangerFill: [
        'border-error-ds-100 bg-error-ds-600',
        'active:bg-error-ds-700 active:border-error-ds-100',
        'md:[&:not(:disabled)]:hover:bg-error-ds-700 md:[&:not(:disabled)]:hover:border-error-ds-100',
        '[&:not(:disabled)]:!text-[var(--content-high-emphasis-inverse)]',
        'disabled:bg-error-ds-50 disabled:border-error-ds-100 disabled:text-black-40',
      ],
      link: [
        'border-transparent bg-transparent underline-offset-4',
        'active:underline',
        'md:[&:not(:disabled)]:hover:underline',
        'disabled:bg-transparent disabled:underline-offset-0',
      ],
    };
    if (this.fullWidth()) {
      baseClasses.push('w-full', 'block');
    }

    if (this.cssClass()) {
      baseClasses.push(this.cssClass());
    }
    return [
      ...baseClasses,
      ...sizeClasses[this.size()],
      ...variantClasses[this.variant()],
    ].join(' ');
  });
}
