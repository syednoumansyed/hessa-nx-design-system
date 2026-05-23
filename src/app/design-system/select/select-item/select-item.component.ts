import { Component, OnInit, computed, inject, input } from '@angular/core';
import { DsIconComponent } from '../../icon/icon.component';
import { faCheck } from '@fortawesome/pro-regular-svg-icons';
import { DsSelectOption } from '../select.interface';
import { CommonModule } from '@angular/common';
import { DsSelectContextService } from '../select-context.service';

@Component({
  selector: 'app-ds-select-item',
  templateUrl: './select-item.component.html',
  standalone: true,
  imports: [DsIconComponent, CommonModule],
})
export class DsSelectItemComponent implements OnInit {
  //#region Inputs
  option = input.required<DsSelectOption>();
  //#endregion

  //#region Injectors
  private readonly contextService = inject(DsSelectContextService);
  //#endregion

  //#region Protected Properties
  protected readonly icon = computed(() => this.option().icon);
  protected readonly display = computed(() => this.option().display);
  protected readonly secondaryDisplay = computed(
    () => this.option().secondaryDisplay,
  );
  protected readonly isSelected = computed(
    () => this.contextService.isSelected(this.option().id) ?? false,
  );
  protected readonly disabled = computed(() => this.option().disabled ?? false);
  protected readonly checkIcon = faCheck;
  //#endregion

  //#region Lifecycle
  constructor() {}

  ngOnInit() {}
  //#endregion

  //#region Methods
  protected onSelectItem() {
    if (this.disabled()) return;
    this.contextService.setSelectedItems(this.option());
  }
  //#endregion
}
