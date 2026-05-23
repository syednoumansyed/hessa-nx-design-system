import { Component, HostBinding } from '@angular/core';
import { ILoadingOverlayComp, ILoadingOverlayParams } from 'ag-grid-community';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';

type CustomLoadingOverlayParams = ILoadingOverlayParams & {
  loadingMessage: string;
};

@Component({
  standalone: true,
  imports: [HesButtonModule],
  template: ``,
})
export class CustomLoadingOverlayComponent implements ILoadingOverlayComp {
  eGui!: HTMLElement;

  init(params: CustomLoadingOverlayParams) {
    this.eGui = document.createElement('div');
    this.refresh(params);
  }

  getGui() {
    return this.eGui;
  }

  refresh(params: CustomLoadingOverlayParams): void {
    this.eGui?.classList.add('w-full');
    this.eGui?.classList.add('h-full');
    this.eGui.innerHTML = `<div class="w-full h-full flex items-center justify-center" role="presentation">
        <ion-spinner></ion-spinner>
     </div>`;
  }
  @HostBinding('class')
  get elementClasses() {
    return 'w-full h-full';
  }
}
