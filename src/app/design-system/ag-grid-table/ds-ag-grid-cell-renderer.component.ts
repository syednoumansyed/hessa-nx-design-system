import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DsChipComponent } from '@ds/chip/chip.component';
import { formatRelativeTimeLabel } from '@shared/utils/relative-time.util';
import { formatToHesDate } from '@utils/date';
import { isRtl } from '@shared/utils/platform';

// ============================================================================
// Types
// ============================================================================

/** Supported cell display types */
export type DsCellType = 'badge' | 'date' | 'duration' | 'phone' | 'text';

/** Badge color variants — mapped to pastel design tokens */
export type DsCellBadgeVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'brand';

/** Badge configuration for the 'badge' cell type */
export interface DsCellBadgeConfig {
  /** Maps raw field values to variant names: { ACTIVE: 'success', INACTIVE: 'danger' } */
  variantMap?: Record<string, DsCellBadgeVariant>;
  /** Custom label formatter — receives (value, rowData) and returns display text.
   *  Falls back to valueFormatted → raw value when not provided. */
  labelFn?: (value: unknown, data: unknown) => string;
}

/** Params passed via cellRendererParams on a DsResponsiveColumn / ColDef */
export interface DsCellRendererParams extends Record<string, unknown> {
  /** Cell display type */
  type: DsCellType;
  /** Badge configuration (used when type = 'badge') */
  badge?: DsCellBadgeConfig;
}

// ============================================================================
// Internal helpers
// ============================================================================

interface BadgeItem {
  label: string;
  variantClass: string;
}

const VARIANT_CLASS_MAP: Record<DsCellBadgeVariant, string> = {
  success:
    'bg-surface-pastel-background-greenRich border-black-8 text-emphasis-high',
  danger:
    'bg-surface-pastel-background-redRich border-black-8 text-emphasis-high',
  warning:
    'bg-surface-pastel-background-orangeRich border-black-8 text-emphasis-high',
  info: 'bg-surface-pastel-background-blueRich border-black-8 text-emphasis-high',
  neutral:
    'bg-surface-pastel-background-grayRich border-black-8 text-emphasis-high',
  brand:
    'bg-surface-pastel-background-brandRich border-black-8 text-emphasis-high',
};

// ============================================================================
// Component
// ============================================================================

@Component({
  selector: 'ds-ag-grid-cell-renderer',
  standalone: true,
  imports: [DsChipComponent],
  template: `
    @switch (type) {
      @case ('badge') {
        <div class="ds-cell-badges">
          @for (badge of badges; track badge.label) {
            <app-ds-chip
              [text]="badge.label"
              [customClasses]="badge.variantClass"
            />
          }
        </div>
      }
      @case ('duration') {
        <span class="ds-ag-cell-text">{{ value }}</span>
      }
      @case ('phone') {
        <span class="ds-ag-cell-text ds-cell-phone">{{ value }}</span>
      }
      @default {
        <div class="flex h-full w-full min-w-0 items-center overflow-hidden">
          <span class="line-clamp-2 min-w-0">{{ value }}</span>
        </div>
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      height: 100%;
      overflow: hidden;
      width: 100%;
      min-width: 0;
    }

    .ds-cell-badges {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .ds-cell-phone {
      direction: ltr;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsAgGridCellRendererComponent implements ICellRendererAngularComp {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly rtl = isRtl();

  type: DsCellType = 'text';
  value = '';
  badges: BadgeItem[] = [];

  private params!: ICellRendererParams & DsCellRendererParams;

  agInit(params: ICellRendererParams & DsCellRendererParams): void {
    this.params = params;
    this.update();
  }

  refresh(params: ICellRendererParams & DsCellRendererParams): boolean {
    this.params = params;
    this.update();
    this.cdr.markForCheck();
    return true;
  }

  private update(): void {
    this.type = this.params.type ?? 'text';

    if (this.type === 'badge') {
      this.buildBadges();
    } else if (this.type === 'date') {
      this.value = this.formatDate(this.params.value);
    } else if (this.type === 'duration') {
      this.value = this.formatDuration(this.params.value);
    } else {
      this.value = this.resolveDisplayValue(this.params.value);
    }
  }

  private buildBadges(): void {
    const rawValue = this.params.value;
    const badgeConfig = this.params.badge;
    const data = this.params.data;
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];

    this.badges = values
      .filter((v) => v != null && v !== '')
      .map((v) => {
        const label = this.resolveBadgeLabel(v, data, badgeConfig);
        const variant = badgeConfig?.variantMap?.[String(v)] ?? 'neutral';
        return {
          label,
          variantClass: VARIANT_CLASS_MAP[variant],
        };
      });
  }

  private resolveBadgeLabel(
    value: unknown,
    data: unknown,
    config?: DsCellBadgeConfig,
  ): string {
    if (config?.labelFn) {
      return config.labelFn(value, data);
    }
    if (this.params.valueFormatted != null) {
      return this.params.valueFormatted;
    }
    return value != null ? String(value) : '';
  }

  private formatDate(value: unknown): string {
    if (value == null || value === '') return '-';

    // Handle Date objects, timestamps, and strings
    let dateString: string;
    if (value instanceof Date) {
      dateString = value.toISOString();
    } else if (typeof value === 'number') {
      dateString = new Date(value).toISOString();
    } else {
      dateString = String(value);
    }

    return formatToHesDate(dateString, this.rtl) ?? '-';
  }

  private formatDuration(value: unknown): string {
    if (value == null || value === '') return '-';
    return formatRelativeTimeLabel(value as string, {
      locale: this.rtl ? 'ar' : 'en',
    });
  }

  private resolveDisplayValue(value: unknown): string {
    if (this.params.valueFormatted != null) {
      return this.params.valueFormatted;
    }
    return value != null ? String(value) : '';
  }
}
