import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IonLabel } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { faCalendarDays } from '@fortawesome/pro-solid-svg-icons';
import { HesAuthDirective } from '@auth/hes-auth.directive';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { DsButtonComponent } from '@ds/button/button.component';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';

export interface IProfileDetails {
  title: string;
  value: string;
  isValueDate?: boolean;
  secondaryValue?: string | null;
  isSecondaryValueDate?: boolean;
  required?: boolean;
  type?: string;
  isEnum?: boolean;
  badges?: string[];
}

@Component({
  selector: 'app-profile-details',
  templateUrl: './profile-details.component.html',
  standalone: true,
  imports: [
    FontAwesomeModule,
    IonLabel,
    DsButtonComponent,
    TranslocoDirective,
    HesDatePipe,
    HesAuthDirective,
    CommonModule,
    RbacDirective,
    EnumLangPipe,
  ],
})
export class ProfileDetailsComponent {
  faCalendarDays = faCalendarDays;
  studentId: string | null;
  currentLang: string = '';

  @Input() profileDetails: Array<IProfileDetails>;
  @Input() onUpdateProfile: () => void;
  @Input() onUpdateRoles: string[];
  @Input() updatePermissionId: number;

  constructor(private translocoService: TranslocoService) {
    this.currentLang = this.translocoService.getActiveLang();
  }

  isValidDate(value: string): boolean {
    // Regular expression to match valid ISO date strings
    const isoDateRegex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

    // Check if the value matches the ISO date format
    if (!isoDateRegex.test(value)) {
      return false;
    }

    // Create a Date object and check if it's valid
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
}
