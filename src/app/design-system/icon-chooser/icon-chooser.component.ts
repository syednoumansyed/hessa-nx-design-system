import {
  Component,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { DsIconComponent } from '../icon/icon.component';
import { DsButtonComponent } from '../button/button.component';
import { faCircleXmark, faHandPointer } from '@fortawesome/pro-solid-svg-icons';
import { getIconDefinitionByName } from './icon-chooser.util';
import { IconChooserModalComponent } from './icon-chooser-modal.component';
import { isMobile } from '@shared/utils/platform';
import { TranslocoDirective } from '@jsverse/transloco';
import { faPen } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-ds-icon-chooser',
  standalone: true,
  imports: [
    CommonModule,
    DsIconComponent,
    DsButtonComponent,
    TranslocoDirective,
  ],
  templateUrl: './icon-chooser.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsIconChooserComponent),
      multi: true,
    },
  ],
})
export class DsIconChooserComponent implements ControlValueAccessor {
  //#region Inputs
  label = input<string>('Select icon');
  required = input<boolean>(false);
  //#endregion

  //#region Injectors
  private readonly modalCtrl = inject(ModalController);
  //#endregion

  //#region Internal State
  protected readonly value = signal<string | null>(null);
  protected readonly isDisabled = signal(false);
  protected readonly editIcon = faPen;
  protected readonly clearIcon = faCircleXmark;
  protected readonly chooseIcon = faHandPointer;
  protected readonly isMobile = isMobile();

  protected readonly selectedIconDef = computed(() =>
    getIconDefinitionByName(this.value()),
  );
  //#endregion

  //#region ControlValueAccessor Callbacks
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  //#endregion

  //#region Methods
  async openModal(): Promise<void> {
    if (this.isDisabled()) return;

    const modal = await this.modalCtrl.create({
      component: IconChooserModalComponent,
      componentProps: {
        currentIcon: this.value(),
      },
      cssClass: 'lg-modal',
      ...(this.isMobile && {
        initialBreakpoint: 1,
        breakpoints: [1],
        handle: false,
      }),
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.value.set(data);
      this.onChange(data);
      this.onTouched();
    }
  }

  clearIcon_click(): void {
    if (this.isDisabled()) return;
    this.value.set(null);
    this.onChange(null);
    this.onTouched();
  }
  //#endregion

  //#region ControlValueAccessor Implementation
  writeValue(value: string | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
  //#endregion
}
