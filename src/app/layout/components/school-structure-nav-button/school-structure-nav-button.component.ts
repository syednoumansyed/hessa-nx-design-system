import { Component, computed, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowRight } from '@fortawesome/pro-regular-svg-icons';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { ModalController } from '@ionic/angular/standalone';
import { SchoolStructureNavDialogComponent } from '../school-structure-nav-dialog/school-structure-nav-dialog.component';
import { LayoutService } from '@layout/layout.service';

@Component({
  selector: 'app-school-structure-nav-button',
  templateUrl: './school-structure-nav-button.component.html',
  standalone: true,
  imports: [HesIconComponent, FontAwesomeModule],
})
export class SchoolStructureNavButtonComponent {
  faArrowRight = faArrowRight;

  private modalCtrl = inject(ModalController);
  layoutService = inject(LayoutService);

  title = computed(() => {
    return (
      this.layoutService.selectedSchoolStructureNavItem()?.name ?? 'Company'
    );
  });
  iconPath = computed(() => {
    return (
      this.layoutService.selectedSchoolStructureNavItem()?.hesIcon.src ??
      'assets/icons/company.svg'
    );
  });

  async openNavModal() {
    const modal = await this.modalCtrl?.create({
      component: SchoolStructureNavDialogComponent,
      componentProps: {},
    });
    modal.present();
  }
}
