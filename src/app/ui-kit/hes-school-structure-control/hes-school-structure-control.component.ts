import {
  Component,
  ElementRef,
  OnInit,
  computed,
  contentChild,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { faAngleDown, faXmark } from '@fortawesome/pro-regular-svg-icons';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { FaIconComponentsProps } from '@shared/types';
import {
  IonPopover,
  IonContent,
  IonModal,
  IonFooter,
} from '@ionic/angular/standalone';
import {
  SchoolStructureControlItem,
  SchoolStructureControlValue,
  SchoolStructureEntityType,
} from './school-structure-control-item.interface';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { isMobile } from '@shared/utils/platform';
import { SchoolStructureControlHelperService } from './school-structure-control.helper.service';
import { ModalController } from '@ionic/angular/standalone';
import { ViewAllSelectValueComponent } from './view-all-select-value/view-all-select-value.component';
import { SchoolStructureApiService } from './data-access/school-structure-api.service';
import { HesSchoolStructureListComponent } from './hes-school-structure-list/hes-school-structure-list.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { StructureDepth } from '@shared/utils/school-structure';
import { randomId } from '@shared/utils/randomId';

@Component({
  selector: 'app-hes-school-structure-control',
  templateUrl: './hes-school-structure-control.component.html',
  standalone: true,
  imports: [
    IonFooter,
    IonPopover,
    HesIconComponent,
    IonPopover,
    IonContent,
    HesSchoolStructureListComponent,
    IonModal,
    TranslocoDirective,
    HesButtonModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HesSchoolStructureControlComponent),
      multi: true,
    },
    SchoolStructureControlHelperService,
  ],
})
export class HesSchoolStructureControlComponent
  implements ControlValueAccessor, OnInit
{
  label = input<string>();
  placeholder = input<string>();
  required = input<boolean>();
  triggerId = randomId();
  poverOverSize = input<'cover' | 'auto'>('auto');
  isMultiSelect = input<boolean>(false);
  onClose = output<SchoolStructureControlValue[]>();
  depth = input<StructureDepth>(StructureDepth.CLASS);
  allowedSelections = input<SchoolStructureEntityType[] | null>(null);
  private modalCtrl = inject(ModalController);
  readonly schoolStructureControlHelperService = inject(
    SchoolStructureControlHelperService,
  );
  readonly selectedValue =
    this.schoolStructureControlHelperService.mapSelectValue;
  readonly faAngleDown: FaIconComponentsProps = {
    icon: faAngleDown,
  };
  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'sm',
  };
  isMobile = isMobile();

  isDisabled = signal<boolean>(false);
  isOpen = signal<boolean>(false);
  value = signal<{ type: string; id: string }[] | null>(null);
  isMultiselect = false;
  private onTouched: any = () => {};
  private readonly schoolStructureControlApiService = inject(
    SchoolStructureApiService,
  );

  displayTargetRef = contentChild<ElementRef>('displayTarget');

  data = computed(() => {
    const list =
      this.schoolStructureControlApiService.getSchoolStructure(this.depth()) ||
      [];
    if (this.allowedSelections()) {
      // Recursive function to update each node and its children
      const updateAccessRecursively = (
        items: SchoolStructureControlItem[],
      ): SchoolStructureControlItem[] => {
        return items.map((item) => {
          // Update the current item
          const updatedItem: SchoolStructureControlItem = {
            ...item,
            isExpended: false,
            hasAccess: this.allowedSelections()!.includes(item.type),
            // Recurse into children (if any)
            children:
              item.children && item.children.length > 0
                ? updateAccessRecursively(item.children)
                : [],
          };
          return updatedItem;
        });
      };

      return updateAccessRecursively(list);
    }
    return list;
  });

  ngOnInit(): void {
    this.writeValue(this.value());
    this.schoolStructureControlHelperService.isMultiSelect =
      this.isMultiSelect();
  }

  writeValue(value: any) {
    this.value.set(value);
    return this.schoolStructureControlHelperService.writeValue(
      value,
      this.data(),
    );
  }

  registerOnChange(fn: any): void {
    this.schoolStructureControlHelperService.onControlChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {}

  onToggle() {
    this.isOpen.update((v) => !v);
  }

  onDeselect(item: SchoolStructureControlItem) {
    this.schoolStructureControlHelperService.onDeselect(item);
    this.schoolStructureControlHelperService.onChange();
  }

  async onShowAllSelect() {
    const modal = await this.modalCtrl.create({
      component: ViewAllSelectValueComponent,
      cssClass: 'sm-modal',
      componentProps: {
        schoolStructureControlHelperService:
          this.schoolStructureControlHelperService,
      },
    });
    modal.present();
  }
  onDismiss() {
    this.onClose.emit(
      this.schoolStructureControlHelperService.mapToFormControlValue(),
    );
  }
}
