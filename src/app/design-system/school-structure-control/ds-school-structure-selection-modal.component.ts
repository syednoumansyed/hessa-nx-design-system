import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBoxComponent } from '@ds/search-box/search-box.component';
import { DsSchoolStructureTreeComponent } from './components/tree/ds-school-structure-tree.component';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { DsSchoolStructureControlHelperService } from './services/ds-school-structure-control-helper.service';
import {
  DsSchoolStructureControlItem,
  DsSchoolStructureControlValue,
  DsSchoolStructureEntityType,
} from './types/school-structure-control.types';
import { DsSchoolStructureApiService } from './services/ds-school-structure-api.service';
import { StructureDepth } from '@shared/utils/school-structure';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import type { DsModalFooterConfig, DsModalHeaderConfig } from '@ds/modal';
import { TranslocoService } from '@jsverse/transloco';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

type SearchTypeSet = ReadonlySet<DsSchoolStructureEntityType>;

@Component({
  selector: 'app-ds-school-structure-selection-modal',
  standalone: true,
  imports: [
    CommonModule,
    SearchBoxComponent,
    DsSchoolStructureTreeComponent,
    NoDataCardComponent,
    DsTranslatePipe,
  ],
  templateUrl: './ds-school-structure-selection-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DsSchoolStructureControlHelperService],
})
export class DsSchoolStructureSelectionModalComponent implements DsModalContentComponent {
  readonly nodes = input<DsSchoolStructureControlItem[] | null>(null);
  readonly initialSelection = input<DsSchoolStructureControlValue[] | null>(
    null,
  );
  readonly isMultiSelect = input(false);
  readonly depth = input<StructureDepth>(StructureDepth.CLASS);
  readonly allowedSelections = input<DsSchoolStructureEntityType[] | null>(
    null,
  );
  readonly searchTypes = input<DsSchoolStructureEntityType[] | null>(null);
  readonly showSearch = input(true);
  readonly requireSelection = input(false);
  readonly showHeader = input(true);
  readonly showFooter = input(true);
  readonly showCancelButton = input(true);
  readonly allowCancelWhenRequired = input(false);
  readonly title = input<string | null>(null);
  readonly confirmLabel = input<string | null>(null);
  readonly cancelLabel = input<string | null>(null);
  readonly searchPlaceholder = input<string | null>(null);
  readonly readOnly = input(false);

  closeModal?: (data?: unknown, role?: string) => void;

  private readonly helper = inject(DsSchoolStructureControlHelperService);
  private readonly api = inject(DsSchoolStructureApiService);
  protected readonly transloco = inject(TranslocoService);
  protected readonly helperRef = this.helper;

  protected readonly searchTerm = signal('');
  readonly primaryButtonDisabled = signal(false);
  protected readonly showSearchEnabled = computed(() => this.showSearch());

  readonly headerConfig: Signal<DsModalHeaderConfig | undefined> = computed(
    () => {
      if (!this.showHeader()) {
        return undefined;
      }
      return {
        title:
          this.title() ??
          this.transloco.translate('global.select_company_campus_school.btn'),
        showCloseButton:
          !this.requireSelection() || this.allowCancelWhenRequired(),
      };
    },
  );

  readonly footerConfig: Signal<DsModalFooterConfig | undefined> = computed(
    () => {
      if (!this.showFooter()) {
        return undefined;
      }
      return {
        primaryButton: {
          text:
            this.confirmLabel() ??
            this.transloco.translate('global.confirm.btn'),
        },
        secondaryButton:
          this.showCancelButton() &&
          (!this.requireSelection() || this.allowCancelWhenRequired())
            ? {
                text:
                  this.cancelLabel() ??
                  this.transloco.translate('global.cancel.btn'),
                variant: 'secondary',
              }
            : undefined,
        fullWidthButtons: true,
      };
    },
  );

  protected readonly baseNodes = computed<DsSchoolStructureControlItem[]>(
    () => {
      const provided = this.nodes();
      const allowed = this.allowedSelections();
      if (provided?.length) {
        return cloneNodesWithMeta(provided, allowed);
      }

      const raw = this.api.getSchoolStructure(this.depth()) ?? [];
      return cloneNodesWithMeta(raw, allowed);
    },
  );

  protected readonly filteredNodes = computed(() => {
    const term = this.searchTerm().trim();
    if (!term) {
      return this.baseNodes();
    }
    const allowedTypes = buildSearchTypeSet(this.searchTypes());
    return filterNodesBySearch(this.baseNodes(), term, allowedTypes);
  });

  constructor() {
    effect(() => {
      this.helper.isMultiSelect = this.isMultiSelect();
    });

    effect(
      () => {
        if (!this.requireSelection()) {
          this.primaryButtonDisabled.set(false);
          return;
        }
        const selected = this.helper.mapSelectValue();
        if (selected.length === 0) {
          this.primaryButtonDisabled.set(true);
          return;
        }
        const filtered = this.filteredNodes();
        const selectionVisible = selected.every((s) =>
          isNodeInTree(filtered, s.id),
        );
        this.primaryButtonDisabled.set(!selectionVisible);
      },
      { allowSignalWrites: true },
    );

    effect(() => {
      const nodes = this.baseNodes();
      const initial = this.initialSelection();
      if (!nodes.length) {
        return;
      }
      // Use untracked to prevent creating dependency on selection signal
      untracked(() => {
        this.helper.writeValue(initial ?? [], nodes);
      });
    });
  }

  onPrimaryClick(): void {
    const selection = this.helper.mapToFormControlValue();
    this.closeModal?.(selection, 'confirm');
  }

  onSecondaryClick(): void {
    this.closeModal?.(null, 'cancel');
  }

  protected handleSearchChange(term: string): void {
    this.searchTerm.set(term ?? '');
  }
}

const MAX_CLONE_DEPTH = 20;

const cloneNodesWithMeta = (
  items: DsSchoolStructureControlItem[],
  allowed: DsSchoolStructureEntityType[] | null,
  parent: DsSchoolStructureControlItem | null = null,
  visited: WeakSet<DsSchoolStructureControlItem> = new WeakSet(),
  depth = 0,
): DsSchoolStructureControlItem[] => {
  if (depth >= MAX_CLONE_DEPTH) {
    return [];
  }

  return items
    .map((item) => {
      if (visited.has(item)) {
        return null;
      }
      visited.add(item);

      const cloned: DsSchoolStructureControlItem = {
        ...item,
        parent,
        isExpanded: item.isExpanded ?? false,
        children: [],
      };

      if (allowed) {
        cloned.hasAccess = allowed.includes(cloned.type);
      }

      if (item.children?.length) {
        cloned.children = cloneNodesWithMeta(
          item.children,
          allowed,
          cloned,
          visited,
          depth + 1,
        );
      }

      return cloned;
    })
    .filter((item): item is DsSchoolStructureControlItem => item !== null);
};

const buildSearchTypeSet = (
  types: DsSchoolStructureEntityType[] | null,
): SearchTypeSet | null => (types?.length ? new Set(types) : null);

const filterNodesBySearch = (
  items: DsSchoolStructureControlItem[],
  term: string,
  searchTypes: SearchTypeSet | null,
  parent: DsSchoolStructureControlItem | null = null,
  visited: WeakSet<DsSchoolStructureControlItem> = new WeakSet(),
  depth = 0,
): DsSchoolStructureControlItem[] => {
  if (depth >= MAX_CLONE_DEPTH) {
    return [];
  }

  const normalized = term.toLowerCase();

  const cloneAll = (
    nodes: DsSchoolStructureControlItem[],
    root: DsSchoolStructureControlItem | null,
    cloneDepth = 0,
  ): DsSchoolStructureControlItem[] => {
    if (cloneDepth >= MAX_CLONE_DEPTH) {
      return [];
    }
    return nodes
      .map((node) => {
        if (visited.has(node)) {
          return null;
        }
        visited.add(node);

        const cloned: DsSchoolStructureControlItem = {
          ...node,
          parent: root,
          isExpanded: true,
          children: [],
        };
        if (node.children?.length) {
          cloned.children = cloneAll(node.children, cloned, cloneDepth + 1);
        }
        return cloned;
      })
      .filter((node): node is DsSchoolStructureControlItem => node !== null);
  };

  return items
    .map((item) => {
      if (visited.has(item)) {
        return null;
      }
      visited.add(item);

      const name = (item.name ?? '').toLowerCase();
      const matchesType = !searchTypes || searchTypes.has(item.type);
      const matchesTerm = matchesType && name.includes(normalized);

      const cloned: DsSchoolStructureControlItem = {
        ...item,
        parent,
        isExpanded: true,
        children: [],
      };

      if (matchesTerm) {
        cloned.children = cloneAll(item.children ?? [], cloned, depth + 1);
        return cloned;
      }

      const children = filterNodesBySearch(
        item.children ?? [],
        term,
        searchTypes,
        cloned,
        visited,
        depth + 1,
      );

      if (!children.length) {
        return null;
      }

      cloned.children = children;
      return cloned;
    })
    .filter((item): item is DsSchoolStructureControlItem => item !== null);
};

const isNodeInTree = (
  nodes: DsSchoolStructureControlItem[],
  id: number,
): boolean =>
  nodes.some((n) => n.id === id || isNodeInTree(n.children ?? [], id));
