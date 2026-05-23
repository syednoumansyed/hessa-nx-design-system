import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { AccessLevel } from '@shared/enums';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-access-level',
  templateUrl: './access-level.component.html',
  standalone: true,
  imports: [CommonModule, EnumLangPipe],
})
export class AccessLevelComponent implements ICellRendererAngularComp {
  accessLevel = signal<AccessLevel | null>(null);

  agInit(params: any): void {
    if (params.value) {
      this.accessLevel.set(params.value);
    }
  }

  refresh(params: ICellRendererParams<any, any, any>) {
    return false;
  }
}
