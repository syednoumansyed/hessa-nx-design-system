import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { FaIconComponentsProps, hesIcon } from 'src/app/shared/types';
import { UserProfileColors, UserType } from '@shared/enums';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { HesSchoolStructureControlComponent } from '@ui-kit/hes-school-structure-control/hes-school-structure-control.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { isMobile } from '@shared/utils/platform';
import { SchoolStructureControlValue } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { StructureDepth } from '@shared/utils/school-structure';
import { HesDateTimePipe } from '@shared/pipes/hes-date-time.pipe';
import { DsButtonComponent } from '@ds/button/button.component';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { openUploadPictureModal } from '@pages/pickup/uplaod-picture-modal';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';
import { DsModalService } from '@ds/modal/modal.service';

export interface profileMetadata {
  faIcon?: FaIconComponentsProps;
  hesIcon?: hesIcon;
  title: string;
  type?: string;
}

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-header.component.html',
  standalone: true,
  imports: [
    FontAwesomeModule,
    HesIconComponent,
    CommonModule,
    HesDatePipe,
    TranslocoDirective,
    RbacDirective,
    HesSchoolStructureControlComponent,
    ReactiveFormsModule,
    HesDateTimePipe,
    DsButtonComponent,
    AvatarComponent,
    EnumLangPipe,
  ],
})
export class ProfileHeaderComponent {
  @Input() fullName: string;
  @Input() metadata: Array<profileMetadata>;
  @Input() translationPath: string;
  @Input() headerFaIcon: FaIconComponentsProps;
  @Input() headerHesIcon: hesIcon;
  @Input() creationDate: string | undefined;
  @Input() createdBy: string | undefined;
  @Input() class: string | undefined;
  @Input() userType: UserType | undefined;
  @Input() associateSchoolControl: FormControl;
  @Input() lastActiveDate: string | undefined | null;
  @Input() profilePictureUrl: string | null = null;
  @Input() userTypeId: string | null;
  @Input() showProfileUploadButton: boolean = false;
  @Input() profileColor: UserProfileColors | undefined =
    UserProfileColors.NEUTRAL;
  @Output() onCloseAssociateSchoolModal = new EventEmitter<
    SchoolStructureControlValue[]
  >();
  depth = StructureDepth.SCHOOL;
  isMobile = isMobile();
  // Below two lines are only for associate personnel with school feature
  public personnelUserType: UserType = UserType.PERSONNEL;
  public associateSchoolPermissionId: number =
    RESOURCE_PERMISSION.personnel.editPersonnelProfile;
  readonly uploadProdilePicturePermissionId =
    RESOURCE_PERMISSION.student.uploadProfilePicture;

  private readonly modalService = inject(DsModalService);
  private readonly translocoService = inject(TranslocoService);
  private readonly imageSlider = inject(ImageSliderService);

  userProfileColors = UserProfileColors;

  onClose($event: SchoolStructureControlValue[]) {
    this.onCloseAssociateSchoolModal.emit($event);
  }

  async initiateProfileUpload() {
    try {
      const result = await FilePicker.pickImages({
        limit: 1,
        readData: true,
      });

      if (result.files && result.files.length > 0) {
        const file = result.files[0];
        const imageBase64 = await this.convertFileToBase64(file.data as string);
        this.handleUpload(imageBase64);
      }
    } catch (error) {
      console.log('Error picking image', error);
    }
  }

  async handleUpload(imageBase64: string) {
    const profilePicture = await openUploadPictureModal({
      modalService: this.modalService,
      translocoService: this.translocoService,
      profilePicture: imageBase64,
      studentId: +this.userTypeId!,
      hasExistingImage: !!this.profilePictureUrl,
    });

    if (profilePicture) {
      this.profilePictureUrl = profilePicture;
    }
  }

  viewProfilePicture() {
    if (!this.profilePictureUrl) return;
    this.imageSlider.show([this.profilePictureUrl]);
  }

  async convertFileToBase64(fileData: string): Promise<string> {
    return `data:image/jpeg;base64,${fileData}`;
  }
}
