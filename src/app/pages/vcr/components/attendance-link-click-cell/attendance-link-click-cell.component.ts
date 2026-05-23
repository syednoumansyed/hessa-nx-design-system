import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-attendance-link-click-cell',
  standalone: true,
  template: ` <div
    class="flex flex-col items-center space-y-4"
    *transloco="let t"
  >
    @if (clicked) {
      <div
        class="self-start rounded-full bg-[#F8F9FC] px-4 py-1 text-xs font-normal text-[#363F72]"
      >
        {{ t('vcr.clicked_link.title') }}
      </div>
    } @else {
      <div
        class="self-start rounded-full bg-[#FFF6ED] px-4 py-1 text-xs font-normal text-[#C4320A]"
      >
        {{ t('vcr.not_clicked.title') }}
      </div>
    }
  </div>`,
  imports: [TranslocoDirective],
})
export class AttendanceLinkClickCellComponent
  implements ICellRendererAngularComp
{
  clicked = false;

  agInit(params: ICellRendererParams): void {
    this.clicked = params.value;
  }

  refresh(_params: ICellRendererParams): boolean {
    return false;
  }

  constructor() {}

  ngOnInit() {}
}
