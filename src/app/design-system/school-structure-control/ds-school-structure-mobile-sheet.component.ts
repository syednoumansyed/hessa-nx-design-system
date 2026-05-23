import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import { DsSchoolStructureControlItem } from './types/school-structure-control.types';
import { DsSchoolStructureControlHelperService } from './services/ds-school-structure-control-helper.service';
import { DsSchoolStructureTreeComponent } from './components/tree/ds-school-structure-tree.component';

@Component({
  selector: 'app-ds-school-structure-mobile-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DsButtonComponent, DsSchoolStructureTreeComponent],
  template: `
    <div class="flex h-full flex-col gap-4 pb-ds-xl">
      <div class="flex items-center justify-between gap-3">
        <h5 class="truncate text-sm font-bold text-neutral-900">
          {{ titleLabel() }}
        </h5>
        <ds-button
          variant="ghost"
          [size]="'sm'"
          [cssClass]="'!font-medium !capitalize !leading-6 text-emphasis-mid'"
          (click)="onClearClick()"
        >
          {{ clearLabel() }}
        </ds-button>
      </div>
      <div class="flex-1 overflow-y-auto">
        <app-ds-school-structure-tree
          [nodes]="resolvedNodes()"
          [helper]="helper()"
          (nodeSelected)="handleNodeSelected($event)"
        ></app-ds-school-structure-tree>
      </div>
    </div>
  `,
})
export class DsSchoolStructureMobileSheetComponent implements DsModalContentComponent {
  readonly nodes = input<
    | Signal<DsSchoolStructureControlItem[] | null>
    | DsSchoolStructureControlItem[]
    | null
  >(null);
  readonly titleLabel = input<string>('');
  readonly clearLabel = input<string>('');
  readonly onClear = input<(() => void) | null>(null);
  readonly onNodeSelected = input<
    ((item: DsSchoolStructureControlItem) => void) | null
  >(null);
  readonly helper = input<DsSchoolStructureControlHelperService | null>(null);
  readonly closeOnSelect = input<boolean>(false);
  closeModal?: (data?: unknown, role?: string) => void;

  private readonly nodesState = signal<DsSchoolStructureControlItem[] | null>(
    null,
  );
  protected readonly resolvedNodes = computed(() => this.nodesState() ?? []);

  constructor() {
    effect(() => {
      const nodes = this.nodes();
      this.nodesState.set(typeof nodes === 'function' ? nodes() : nodes);
    });
  }

  protected onClearClick(): void {
    this.onClear()?.();
  }

  protected handleNodeSelected(item: DsSchoolStructureControlItem): void {
    this.onNodeSelected()?.(item);

    if (this.closeOnSelect() && this.closeModal) {
      this.closeModal(null, 'confirm');
    }
  }
}
