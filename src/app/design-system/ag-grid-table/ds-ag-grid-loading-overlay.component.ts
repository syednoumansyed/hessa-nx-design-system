import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ILoadingOverlayAngularComp } from 'ag-grid-angular';
import { ILoadingOverlayParams } from 'ag-grid-community';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'ds-ag-grid-loading-overlay',
  standalone: true,
  imports: [IonSpinner],
  template: `
    <div class="ds-ag-grid-loading-overlay">
      <div class="ds-ag-grid-loading-spinner">
        <ion-spinner name="crescent" />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      width: 100%;
      height: 100%;
      background-color: rgba(255, 255, 255, 0.8);
    }

    .ds-ag-grid-loading-overlay {
      position: sticky;
      top: 40%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ds-ag-grid-loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background-color: var(--surface-primary, #fff);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
    }

    ion-spinner {
      width: 40px;
      height: 40px;
      --color: var(--stroke-color-brand-strong, #7c3ff1);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsAgGridLoadingOverlayComponent implements ILoadingOverlayAngularComp {
  agInit(_params: ILoadingOverlayParams): void {}
}
