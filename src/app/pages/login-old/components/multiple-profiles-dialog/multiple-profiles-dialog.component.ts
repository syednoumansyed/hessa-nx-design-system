import { Component, Input } from '@angular/core';
import { IonItem, IonList } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  faUser,
  faAngleRight,
  faAngleLeft,
} from '@fortawesome/pro-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { HesInitialsPipe } from '@shared/pipes/hes-name-initials.pipe';
import { UserProfile, UserProfilePayload } from '@auth/model';
import { Gender, Language } from '@shared/enums';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';

@Component({
  selector: 'app-multiple-profiles-dialog',
  templateUrl: './multiple-profiles-dialog.component.html',
  styleUrls: ['./multiple-profiles-dialog.component.scss'],
  standalone: true,
  imports: [
    IonItem,
    IonList,
    TranslocoDirective,
    HesButtonModule,
    CommonModule,
    HesInitialsPipe,
  ],
})
export class MultipleProfilesDialogComponent {
  currentLang: string = '';

  constructor(private translocoService: TranslocoService) {
    this.currentLang = this.translocoService.getActiveLang();
  }

  faUser = faUser;
  faAngleLeft = faAngleLeft;
  faAngleRight = faAngleRight;
  gender = Gender;
  langEnum = Language;

  // Accept payload without displayName
  @Input() sendSelectedProfile: (
    otp: string,
    selectedProfile: UserProfilePayload | null,
  ) => void;
  @Input() code: string;

  @Input() profilesList: Array<UserProfile>;
  @Input() phoneNumber: string;

  onProfileSelection(selectedProfile: UserProfile) {
    const { displayName, ...payload } = selectedProfile;
    // Pass payload as UserProfilePayload (displayName removed)
    this.sendSelectedProfile(this.code ?? '', payload as UserProfilePayload);
  }
}
