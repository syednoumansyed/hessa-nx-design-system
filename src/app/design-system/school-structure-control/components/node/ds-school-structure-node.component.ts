import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import {
  faChevronDown,
  faChevronRight,
  faCircleCheck,
} from '@fortawesome/pro-regular-svg-icons';
import { DsSchoolStructureControlHelperService } from '../../services/ds-school-structure-control-helper.service';
import { DsSchoolStructureControlItem } from '../../types/school-structure-control.types';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';

@Component({
  selector: 'app-ds-school-structure-node',
  templateUrl: './ds-school-structure-node.component.html',
  styleUrls: ['./ds-school-structure-node.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, DsIconComponent],
})
export class DsSchoolStructureNodeComponent {
  /* ------------ Inputs ------------ */
  readonly item = input.required<DsSchoolStructureControlItem>();
  readonly firstLevel = input(false);
  readonly isFirstSibling = input(false);
  readonly isLastSibling = input(false);
  readonly disabled = input(false);
  readonly readOnly = input(false);
  readonly helper = input<DsSchoolStructureControlHelperService | null>(null);
  /** Current depth level to prevent infinite recursion. Max depth is 20. */
  readonly depth = input(0);

  /* ------------ Outputs ------------ */
  @Output() nodeSelected = new EventEmitter<DsSchoolStructureControlItem>();
  @Output() nodeToggled = new EventEmitter<DsSchoolStructureControlItem>();

  /* ------------ Dependencies ------------ */
  private readonly defaultHelper = inject(
    DsSchoolStructureControlHelperService,
    { optional: true },
  );

  /* ------------ State ------------ */
  private readonly explicitShowChildren = signal<boolean | undefined>(
    undefined,
  );

  readonly chevronRightIcon: DsIcon = faChevronRight;
  readonly chevronDownIcon: DsIcon = faChevronDown;
  readonly checkIcon: DsIcon = faCircleCheck;
  readonly toggleIconClass = 'text-[#4c5461]';
  readonly defaultIcon = 'assets/icons/school-structure.svg';

  readonly toggleIcon = computed<DsIcon>(() =>
    this.showChildren() ? this.chevronDownIcon : this.chevronRightIcon,
  );

  readonly iconClass = computed(() => {
    const current = this.item();
    const disabled = this.disabled() || !current.hasAccess;
    return disabled ? 'node-icon--disabled' : 'node-icon--active';
  });

  private static readonly MAX_DEPTH = 20;

  /* ------------ Computed ------------ */
  readonly hasChildren = computed(
    () =>
      (this.item().children?.length ?? 0) > 0 &&
      this.depth() < DsSchoolStructureNodeComponent.MAX_DEPTH,
  );

  readonly showChildren = computed(() => {
    const forced = this.explicitShowChildren();
    if (forced !== undefined) {
      return forced;
    }
    return this.item().isExpanded ?? false;
  });

  private readonly helperRef = computed(
    () => this.helper() ?? this.defaultHelper ?? null,
  );
  readonly isSelected = computed(() => {
    const helper = this.helperRef();
    return helper ? helper.hasValue(this.item()) : false;
  });
  readonly hasSelectedAncestor = computed(() => {
    const helper = this.helperRef();
    if (!helper) {
      return false;
    }
    const visited = new WeakSet<DsSchoolStructureControlItem>();
    let current = this.item().parent;
    while (current) {
      if (visited.has(current)) {
        break;
      }
      visited.add(current);
      if (helper.hasValue(current)) {
        return true;
      }
      current = current.parent;
    }
    return false;
  });
  readonly showCheckIndicator = computed(
    () => this.isSelected() || this.hasSelectedAncestor(),
  );

  /* ------------ Event Handlers ------------ */
  toggleChildren(event: Event) {
    event.stopPropagation();
    const next = !this.showChildren();
    this.explicitShowChildren.set(next);
    if (next) {
      this.item().isExpanded = true;
    }
    this.nodeToggled.emit(this.item());
  }

  handleClick() {
    const current = this.item();
    if (this.disabled() || this.readOnly() || !current.hasAccess) {
      return;
    }

    const helper = this.helperRef();
    if (!helper) {
      return;
    }
    helper.onToggle(current);
    this.nodeSelected.emit(current);
  }
}
