import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PickupService } from '@pages/pickup/data-access/pickup.service';
import { IonImg } from '@ionic/angular/standalone';
import { DenialReason } from '@shared/dto-transformation/pick-up/pickup.interface';

@Component({
  selector: 'app-denial-reason-selection',
  standalone: true,
  templateUrl: './denial-reason-selection.component.html',
  imports: [TranslocoDirective, CommonModule, IonImg],
})
export class DenialReasonSelectionComponent implements OnInit {
  activeSelection: number;
  currentLang: string = '';

  // Function provided by DsModalWrapperComponent to dismiss the modal
  closeModal: (data?: unknown, role?: string) => void;

  // Signal to control primary button disabled state (exposed for modal wrapper)
  primaryButtonDisabled = signal(true);

  isLoading = signal(true);

  private readonly translocoService = inject(TranslocoService);
  private readonly pickupService = inject(PickupService);
  denialReasons = signal<DenialReason[]>([]);

  ngOnInit() {
    this.currentLang = this.translocoService.getActiveLang();
    this.pickupService.getDenialReasons().subscribe((res) => {
      this.denialReasons.set(res);
      this.isLoading.set(false);
    });
  }

  updateSelectedValue(id: number) {
    this.activeSelection = id;
    this.primaryButtonDisabled.set(false);
  }

  // Called by modal wrapper when primary (Submit) button is clicked
  onPrimaryClick() {
    if (this.activeSelection) {
      this.closeModal?.(this.activeSelection, 'confirm');
    }
  }

  // Called by modal wrapper when secondary (Cancel) button is clicked
  onSecondaryClick() {
    this.closeModal?.(undefined, 'cancel');
  }
}
