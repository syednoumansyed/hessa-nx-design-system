import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { StructureDepth } from '@shared/utils/school-structure';
import {
  DsSchoolStructureControlItem,
  DsSchoolStructureControlValue,
  DsSchoolStructureEntityType,
} from './types/school-structure-control.types';
import { DsSchoolStructureSelectionService } from './ds-school-structure-selection.service';
import type { DsModalResult } from '@ds/modal';

@Component({
  selector: 'app-ds-school-structure-selection-trigger',
  standalone: true,
  template: `
    <span class="inline-flex" (click)="openSelection()">
      <ng-content></ng-content>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsSchoolStructureSelectionTriggerComponent {
  readonly nodes = input<DsSchoolStructureControlItem[] | null>(null);
  readonly selection = input<DsSchoolStructureControlValue[] | null>(null);
  readonly isMultiSelect = input(false);
  readonly depth = input<StructureDepth>(StructureDepth.CLASS);
  readonly allowedSelections = input<DsSchoolStructureEntityType[] | null>(
    null,
  );
  readonly searchTypes = input<DsSchoolStructureEntityType[] | null>(null);
  readonly title = input<string | null>(null);
  readonly confirmLabel = input<string | null>(null);
  readonly cancelLabel = input<string | null>(null);
  readonly searchPlaceholder = input<string | null>(null);
  readonly showSearch = input(true);
  readonly requireSelection = input(false);

  readonly selectionConfirmed = output<DsSchoolStructureControlValue[]>();
  readonly modalClosed =
    output<DsModalResult<DsSchoolStructureControlValue[]>>();

  private readonly selectionService = inject(DsSchoolStructureSelectionService);

  private readonly config = computed(() => ({
    nodes: this.nodes(),
    initialSelection: this.selection(),
    isMultiSelect: this.isMultiSelect(),
    depth: this.depth(),
    allowedSelections: this.allowedSelections(),
    searchTypes: this.searchTypes(),
    title: this.title(),
    confirmLabel: this.confirmLabel(),
    cancelLabel: this.cancelLabel(),
    searchPlaceholder: this.searchPlaceholder(),
    showSearch: this.showSearch(),
    requireSelection: this.requireSelection(),
  }));

  protected async openSelection(): Promise<void> {
    const result = await this.selectionService.open(this.config());
    this.modalClosed.emit(result);
    if (result.role === 'confirm' && Array.isArray(result.data)) {
      this.selectionConfirmed.emit(result.data);
    }
  }
}
