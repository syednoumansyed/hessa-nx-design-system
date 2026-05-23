import { Component, OnInit } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { INoRowsOverlayAngularComp } from 'ag-grid-angular';
import { INoRowsOverlayParams } from 'ag-grid-community';

@Component({
  selector: 'app-custom-no-record-found-overly',
  templateUrl: './custom-no-record-found-overly.component.html',
  standalone: true,
  imports: [TranslocoDirective],
})
export class CustomNoRecordFoundOverlyComponent
  implements INoRowsOverlayAngularComp
{
  agInit(params: INoRowsOverlayParams): void {}
}
