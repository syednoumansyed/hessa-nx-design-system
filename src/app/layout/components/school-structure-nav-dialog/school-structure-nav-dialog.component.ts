import { Component, inject, signal } from '@angular/core';
import { SchoolStructureNavItemComponent } from '../school-structure-nav-item/school-structure-nav-item.component';
import { ModalController } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';

@Component({
  selector: 'app-school-structure-nav-dialog',
  templateUrl: './school-structure-nav-dialog.component.html',
  standalone: true,
  imports: [SchoolStructureNavItemComponent, HesButtonModule],
})
export class SchoolStructureNavDialogComponent {
  private modalCtrl = inject(ModalController);

  private scopedSchoolStructure = inject(SchoolStructureScopeService);
  schoolStructure = this.scopedSchoolStructure.userScopedSchoolStructure;

  selectedItem = signal<number | null>(null);

  submit() {
    this.modalCtrl.dismiss({ role: 'confirm' });
  }
}
