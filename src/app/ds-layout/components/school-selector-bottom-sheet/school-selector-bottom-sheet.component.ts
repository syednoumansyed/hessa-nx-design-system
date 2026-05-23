import { Component, inject, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { SchoolStructureTreeComponent } from '../school-structure-tree/school-structure-tree.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { StructureDepth } from '@shared/utils/school-structure';

@Component({
  selector: 'app-school-selector-bottom-sheet',
  templateUrl: './school-selector-bottom-sheet.component.html',
  standalone: true,
  imports: [SchoolStructureTreeComponent, TranslocoDirective],
})
export class SchoolSelectorBottomSheetComponent implements OnInit {
  constructor() {}

  private readonly modalCtrl = inject(ModalController);

  /** Optional max depth for the school structure tree. If not provided, shows full depth. */
  @Input() maxDepth?: StructureDepth;

  ngOnInit() {}

  close() {
    this.modalCtrl.dismiss();
  }

  onSelectionComplete(item: unknown) {
    this.modalCtrl.dismiss(item, 'selection');
  }
}
