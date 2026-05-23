import { Component, inject } from '@angular/core';
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { SchoolStructureNavItemComponent } from '../school-structure-nav-item/school-structure-nav-item.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAnglesLeft, faAnglesRight } from '@fortawesome/pro-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { LayoutService } from '@layout/layout.service';

@Component({
  selector: 'app-school-structure-nav-menu',
  templateUrl: './school-structure-nav-menu.component.html',
  styleUrls: ['./school-structure-nav-menu.component.scss'],
  standalone: true,
  imports: [
    IonContent,
    SchoolStructureNavItemComponent,
    FontAwesomeModule,
    IonHeader,
    IonToolbar,
    CommonModule,
  ],
})
export class SchoolStructureNavMenuComponent {
  faAnglesLeft = faAnglesLeft;
  faAnglesRight = faAnglesRight;

  layoutService = inject(LayoutService);
  scopedSchoolStructure = inject(SchoolStructureScopeService);

  schoolStructure = this.scopedSchoolStructure.userScopedSchoolStructure;

  isCollapsed = this.layoutService.isSideNavCollapsed;
}
