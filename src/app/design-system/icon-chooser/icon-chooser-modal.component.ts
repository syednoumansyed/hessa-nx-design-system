import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonContent, ModalController } from '@ionic/angular/standalone';
import { DsInputComponent } from '../input/input.component';
import { DsIconComponent } from '../icon/icon.component';
import { DsButtonComponent } from '../button/button.component';
import { faMagnifyingGlass } from '@fortawesome/pro-regular-svg-icons';
import { ICON_CHOOSER_OPTIONS, IconOption } from './icon-chooser.constant';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-ds-icon-chooser-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    DsInputComponent,
    DsIconComponent,
    DsButtonComponent,
    TranslocoDirective,
  ],
  templateUrl: './icon-chooser-modal.component.html',
})
export class IconChooserModalComponent implements OnInit {
  //#region Inputs
  currentIcon = input<string | null>(null);
  //#endregion

  //#region Injectors
  private readonly modalCtrl = inject(ModalController);
  //#endregion

  //#region Properties
  protected readonly searchIcon = faMagnifyingGlass;
  protected readonly searchControl = new FormControl('');
  protected readonly selectedIcon = signal<string | null>(null);
  protected readonly searchTerm = signal('');

  protected readonly filteredIcons = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return ICON_CHOOSER_OPTIONS;
    }
    return ICON_CHOOSER_OPTIONS.filter(
      (opt) =>
        opt.name.toLowerCase().includes(term) ||
        opt.searchTerms.some((searchTerm) =>
          searchTerm.toLowerCase().includes(term),
        ),
    );
  });
  //#endregion

  //#region Lifecycle
  ngOnInit(): void {
    this.selectedIcon.set(this.currentIcon());

    this.searchControl.valueChanges.subscribe((value) => {
      this.searchTerm.set(value ?? '');
    });
  }
  //#endregion

  //#region Methods
  protected selectIcon(iconOption: IconOption): void {
    this.selectedIcon.set(iconOption.name);
  }

  protected cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  protected confirm(): void {
    this.modalCtrl.dismiss(this.selectedIcon(), 'confirm');
  }
  //#endregion
}
