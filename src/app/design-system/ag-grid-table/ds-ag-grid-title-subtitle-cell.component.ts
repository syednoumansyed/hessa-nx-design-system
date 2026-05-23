import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AvatarComponent } from '@ds/avatar/avatar.component';

export interface DsAgGridTitleSubtitleCellParams {
  titleField?: string;
  subtitleField?: string;
  subtitleFields?: string[];
  subtitleSeparator?: string;
  /** Custom getter function for the subtitle value. Takes row data, returns string. */
  subtitleGetter?: (data: any) => string;
  /** Field name on row data that contains the avatar image URL */
  avatarField?: string;
  /** Field name on row data that contains the full name for avatar initials (defaults to titleField) */
  avatarNameField?: string;
}

@Component({
  selector: 'ds-ag-grid-title-subtitle-cell',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <div class="flex min-w-0 items-center gap-2 py-1">
      @if (showAvatar) {
        <app-ds-avatar
          [fullName]="avatarName"
          [imageUrl]="avatarUrl"
          size="sm"
          [includeBorder]="false"
        />
      }
      <div class="flex min-w-0 flex-col gap-0.5">
        <span
          class="ds-ag-cell-text single-line-sm-mid-emphasis max-w-fit truncate text-emphasis-high"
          >{{ title }}</span
        >
        @if (subtitle) {
          <span
            class="ds-ag-cell-text single-line-xs-mid-emphasis max-w-fit truncate text-emphasis-mid"
            >{{ subtitle }}</span
          >
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      overflow: hidden;
      min-width: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsAgGridTitleSubtitleCellComponent implements ICellRendererAngularComp {
  title = '';
  subtitle = '';
  showAvatar = false;
  avatarUrl: string | null = null;
  avatarName = '';

  private params!: ICellRendererParams & DsAgGridTitleSubtitleCellParams;
  private readonly cdr = inject(ChangeDetectorRef);

  agInit(params: ICellRendererParams & DsAgGridTitleSubtitleCellParams): void {
    this.params = params;
    this.updateValues();
  }

  refresh(
    params: ICellRendererParams & DsAgGridTitleSubtitleCellParams,
  ): boolean {
    this.params = params;
    this.updateValues();
    return true;
  }

  private updateValues(): void {
    const {
      data,
      titleField,
      subtitleField,
      subtitleFields,
      subtitleSeparator,
      subtitleGetter,
      avatarField,
      avatarNameField,
    } = this.params;

    // Get title value
    if (titleField && data) {
      this.title = this.getNestedValue(data, titleField) ?? '';
    } else {
      this.title = this.params.value ?? '';
    }

    // Get subtitle value — subtitleGetter takes priority
    if (subtitleGetter && data) {
      this.subtitle = subtitleGetter(data) ?? '';
    } else if (subtitleFields?.length && data) {
      const separator = subtitleSeparator ?? ' - ';
      this.subtitle = subtitleFields
        .map((field) => this.getNestedValue(data, field))
        .filter(Boolean)
        .join(separator);
    } else if (subtitleField && data) {
      this.subtitle = this.getNestedValue(data, subtitleField) ?? '';
    } else {
      this.subtitle = '';
    }

    // Get avatar values
    this.showAvatar = !!avatarField;
    if (avatarField && data) {
      this.avatarUrl = this.getNestedValue(data, avatarField) ?? null;
      this.avatarName =
        (avatarNameField
          ? this.getNestedValue(data, avatarNameField)
          : this.title) ?? '';
    }

    // Trigger change detection since we're using OnPush strategy
    this.cdr.markForCheck();
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }
}
