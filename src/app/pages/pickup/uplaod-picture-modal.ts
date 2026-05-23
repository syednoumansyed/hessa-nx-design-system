import { DsModalService } from '@ds/modal/modal.service';
import { TranslocoService } from '@jsverse/transloco';
import { UploadProfilePictureComponent } from '@shared/components/upload-profile-picture/upload-profile-picture.component';

interface UploadPictureProps {
  profilePicture: string;
  studentId: number;
  hasExistingImage: boolean;
}

export async function openUploadPictureModal({
  modalService,
  translocoService,
  profilePicture,
  studentId,
  hasExistingImage,
}: {
  modalService: DsModalService;
  translocoService: TranslocoService;
  profilePicture: string;
  studentId: number;
  hasExistingImage: boolean;
}): Promise<string | undefined> {
  const modalRef = await modalService.open<UploadPictureProps, string>({
    component: UploadProfilePictureComponent,
    componentProps: {
      profilePicture,
      studentId,
      hasExistingImage,
    },
    headerConfig: {
      title: translocoService.translate(
        'action.student.profile.upload_picture',
      ),
      showCloseButton: true,
    },
    footerConfig: {
      primaryButton: {
        text: translocoService.translate('global.upload.btn'),
      },
      secondaryButton: {
        text: translocoService.translate('global.cancel.btn'),
      },
    },
    size: 'lg',
  });

  const result = await modalRef.onDismiss();
  if (result.role === 'confirm' && result.data) {
    return result.data;
  }
  return undefined;
}
