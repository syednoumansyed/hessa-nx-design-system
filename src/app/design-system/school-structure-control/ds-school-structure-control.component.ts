import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DsChipComponent } from '@ds/chip/chip.component';
import { DsSchoolStructureTreeComponent } from './components/tree/ds-school-structure-tree.component';
import { faAngleDown, faAngleUp } from '@fortawesome/pro-regular-svg-icons';
import { DsSchoolStructureControlHelperService } from './services/ds-school-structure-control-helper.service';
import {
  DsSchoolStructureControlItem,
  DsSchoolStructureControlValue,
  DsSchoolStructureEntityType,
} from './types/school-structure-control.types';
import { DsSchoolStructureApiService } from './services/ds-school-structure-api.service';
import { StructureDepth } from '@shared/utils/school-structure';
import { isMobile } from '@shared/utils/platform';
import { randomId } from '@shared/utils/randomId';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsInputComponent } from '@ds/input/input.component';
import {
  CdkOverlayOrigin,
  ConnectionPositionPair,
  Overlay,
  OverlayModule,
} from '@angular/cdk/overlay';
import { DsModalService } from '@ds/modal';
import { DsSchoolStructureMobileSheetComponent } from './ds-school-structure-mobile-sheet.component';
import { TranslocoService } from '@jsverse/transloco';
import type { DsModalRef } from '@ds/modal';

@Component({
  selector: 'app-ds-school-structure-control',
  templateUrl: './ds-school-structure-control.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DsChipComponent,
    DsSchoolStructureTreeComponent,
    TranslocoDirective,
    DsInputComponent,
    ReactiveFormsModule,
    OverlayModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsSchoolStructureControlComponent),
      multi: true,
    },
    DsSchoolStructureControlHelperService,
  ],
})
export class DsSchoolStructureControlComponent implements ControlValueAccessor {
  /* ------------ Inputs ------------ */
  readonly label = input<string>();
  readonly placeholder = input<string>();
  readonly required = input(false);
  readonly popoverSize = input<'cover' | 'auto'>('auto');
  readonly isMultiSelect = input(false);
  readonly depth = input<StructureDepth>(StructureDepth.CLASS);
  readonly allowedSelections = input<DsSchoolStructureEntityType[] | null>(
    null,
  );

  /* ------------ Outputs ------------ */
  readonly onClose = output<DsSchoolStructureControlValue[]>();

  /* ------------ Template references ------------ */
  readonly displayTargetRef = contentChild<ElementRef>('displayTarget');
  private readonly defaultOverlayTrigger = viewChild('defaultOverlayTrigger', {
    read: CdkOverlayOrigin,
  });
  private readonly customOverlayTrigger = viewChild('customOverlayTrigger', {
    read: CdkOverlayOrigin,
  });

  /* ------------ Dependencies ------------ */
  private readonly helper = inject(DsSchoolStructureControlHelperService);
  private readonly api = inject(DsSchoolStructureApiService);
  private readonly document = inject(DOCUMENT, { optional: true });
  private readonly overlay = inject(Overlay);
  private readonly modalService = inject(DsModalService);
  private readonly translationService = inject(TranslocoService);
  private mobileModalRef: DsModalRef | null = null;
  protected readonly helperRef = this.helper;

  /* ------------ UI State ------------ */
  readonly triggerId = randomId();
  readonly isMobile = isMobile();
  readonly isOpen = signal(false);
  readonly isDisabled = signal(false);
  readonly popoverWidth = signal<number | null>(null);
  readonly popoverMaxHeight = signal<number | null>(null);
  readonly mobileNodes = computed(() => this.data());
  readonly overlayScrollStrategy = this.overlay.scrollStrategies.reposition();
  readonly overlayPositions = [
    new ConnectionPositionPair(
      { originX: 'start', originY: 'bottom' },
      { overlayX: 'start', overlayY: 'top' },
      0,
      20,
    ),
    new ConnectionPositionPair(
      { originX: 'start', originY: 'top' },
      { overlayX: 'start', overlayY: 'bottom' },
      0,
      -3,
    ),
  ];

  /* ------------ Icons ------------ */
  readonly faAngleDown = faAngleDown;
  readonly faAngleUp = faAngleUp;

  /* ------------ Form Controls ------------ */
  readonly displayControl = new FormControl({ value: '', disabled: true });

  /* ------------ Computed ------------ */
  readonly selectedValue = this.helper.mapSelectValue;
  readonly overlayOrigin = computed(
    () => this.customOverlayTrigger() ?? this.defaultOverlayTrigger(),
  );

  readonly displayText = computed(() => {
    const items = this.selectedValue();
    if (!items.length) {
      return '';
    }

    if (items.length === 1) {
      return items[0]?.name ?? '';
    }

    return `${items.length} selected`;
  });

  readonly data = computed<DsSchoolStructureControlItem[] | null>(() => {
    const raw =
      this.api.getSchoolStructure(this.depth()) ??
      ([] as DsSchoolStructureControlItem[]);
    const allowed = this.allowedSelections();

    const cloneWithMeta = (
      items: DsSchoolStructureControlItem[],
      parent: DsSchoolStructureControlItem | null = null,
    ): DsSchoolStructureControlItem[] =>
      items.map((item) => {
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
          cloned.children = cloneWithMeta(item.children, cloned);
        } else {
          cloned.children = [];
        }

        return cloned;
      });

    return cloneWithMeta(raw);
  });

  readonly limitedSelected = computed(() => {
    const items = this.selectedValue();
    if (items.length <= 3) {
      return items;
    }
    return items.slice(0, 3);
  });

  readonly overflowCount = computed(() => {
    const items = this.selectedValue();
    return items.length > 3 ? items.length - 3 : 0;
  });

  /* ------------ ControlValueAccessor ------------ */
  private onChange: (value: DsSchoolStructureControlValue[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      this.helper.isMultiSelect = this.isMultiSelect();
    });

    effect(() => {
      const disabled = this.isDisabled();
      if (disabled) {
        this.displayControl.disable({ emitEvent: false });
      } else {
        this.displayControl.enable({ emitEvent: false });
      }
    });

    effect(() => {
      const text = this.displayText();
      this.displayControl.setValue(text, { emitEvent: false });
    });

    effect(() => {
      if (this.required()) {
        this.displayControl.addValidators(Validators.required);
      } else {
        this.displayControl.removeValidators(Validators.required);
      }
      this.displayControl.updateValueAndValidity({ emitEvent: false });
    });

    this.helper.onControlChange = (value: DsSchoolStructureControlValue[]) => {
      this.onChange(value);
    };
  }

  writeValue(value: DsSchoolStructureControlValue[] | null): void {
    this.helper.isMultiSelect = this.isMultiSelect();
    this.helper.writeValue(value ?? [], this.data());
  }

  registerOnChange(fn: (value: DsSchoolStructureControlValue[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  /* ------------ UI Actions ------------ */
  togglePanel() {
    if (this.isDisabled()) {
      return;
    }

    if (this.isMobile) {
      if (this.mobileModalRef || this._openingMobile) {
        if (this.mobileModalRef) {
          void this.mobileModalRef.dismiss(null, 'close');
        }
      } else {
        void this.openMobileModal();
      }
      return;
    }

    if (!this.isOpen()) {
      this.syncOverlayDimensions();
    }

    this.isOpen.update((value) => !value);
  }

  closePanel() {
    if (this.isMobile && this.mobileModalRef) {
      void this.mobileModalRef.dismiss(null, 'close');
      return;
    }

    if (!this.isOpen()) {
      return;
    }
    this.isOpen.set(false);
    this.emitClose();
  }

  onNodeSelected(item: DsSchoolStructureControlItem) {
    if (!this.isMultiSelect()) {
      if (!this.isMobile) {
        this.closePanel();
      }
    }
  }

  onDeselect(item: DsSchoolStructureControlItem) {
    this.helper.onDeselect(item);
    this.helper.onChange();
  }

  clearSelection() {
    const current = [...this.selectedValue()];
    current.forEach((item) => this.helper.onDeselect(item));
    this.helper.onChange();
  }

  onTriggerClick(event: Event) {
    event.preventDefault();
    if (this.isDisabled()) {
      return;
    }
    this.togglePanel();
  }

  onDismiss() {
    this.isOpen.set(false);
    this.emitClose();
  }

  private _openingMobile = false;
  private async openMobileModal(): Promise<void> {
    if (this.mobileModalRef || this._openingMobile) {
      return;
    }

    this._openingMobile = true;
    this.isOpen.set(true);
    this.mobileModalRef = await this.modalService.open({
      component: DsSchoolStructureMobileSheetComponent,
      componentProps: {
        nodes: this.mobileNodes,
        helper: this.helper,
        titleLabel: this.translationService.translate(
          'global.select_company_campus_school.btn',
        ),
        clearLabel: this.translationService.translate('global.clear.btn'),
        onClear: () => this.clearSelection(),
        onNodeSelected: (item: DsSchoolStructureControlItem) =>
          this.onNodeSelected(item),
        closeOnSelect: !this.isMultiSelect(),
      },

      size: 'lg',
      mobileBreakpoint: 0.9,
      mobileBreakpoints: [0, 0.8, 0.9],
      contentClass: 'px-ds-xl pb-[60px]',
      backdropDismiss: true,
      respectTopSafeArea: true,
    });

    this._openingMobile = false;
    await this.mobileModalRef.onDismiss();
    this.mobileModalRef = null;
    this.isOpen.set(false);
    this.emitClose();
  }

  private emitClose() {
    this.onTouched();
    this.onClose.emit(this.helper.mapToFormControlValue());
  }

  private syncOverlayDimensions() {
    let targetElement: HTMLElement | null = null;
    const origin = this.overlayOrigin();
    if (origin) {
      targetElement = origin.elementRef.nativeElement;
    }

    if (!targetElement) {
      targetElement = this.displayTargetRef()?.nativeElement ?? null;
    }

    if (!targetElement && this.document) {
      targetElement = this.document.getElementById(this.triggerId);
    }

    if (!targetElement) {
      return;
    }

    const rect = targetElement.getBoundingClientRect();

    if (rect.width) {
      this.popoverWidth.set(rect.width);
    }

    const defaultView =
      this.document?.defaultView ??
      (typeof window !== 'undefined' ? window : null);

    if (!defaultView) {
      this.popoverMaxHeight.set(null);
      return;
    }

    const margin = 16;
    const topSpace = rect.top - margin;
    const bottomSpace = defaultView.innerHeight - rect.bottom - margin;
    const viewportLimit = Math.max(defaultView.innerHeight - margin * 2, 0);

    let maxHeight: number;

    if (bottomSpace <= 0 && topSpace <= 0) {
      maxHeight = viewportLimit;
    } else {
      const bestSpace = Math.max(topSpace, bottomSpace);
      maxHeight = Math.min(bestSpace, viewportLimit);
    }

    if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
      maxHeight = viewportLimit;
    }

    this.popoverMaxHeight.set(Math.floor(maxHeight));
  }
}
