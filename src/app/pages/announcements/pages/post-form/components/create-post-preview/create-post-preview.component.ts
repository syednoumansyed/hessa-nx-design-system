import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  ModalController,
  IonFooter,
  IonSpinner,
} from '@ionic/angular/standalone';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { PostPayload } from '../../../../data-access/post.dto';
import { FaIconComponentsProps, hesIcon } from '@shared/types';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';

import { findNodeInSchoolStructure } from '@ui-kit/hes-school-structure-control/utils/find-node-in-school-structure.util';
import { AnnouncementService } from '@pages/announcements/data-access/announcement.service';
import {
  SchoolStructureControlItem,
  SchoolStructureControlValue,
} from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { PostFormStore } from '../../data-access/post-form.store';
import { finalize, switchMap } from 'rxjs';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { ToastrService } from 'ngx-toastr';
import { HesAttachmentPreviewComponent } from '@ui-kit/hes-attachment-form-control/attachment-preview/attachment-preview.component';
import {
  IAttachmentControlUploadedValue,
  IAttachmentControlValue,
} from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { Router } from '@angular/router';
import { PreviewPostCardComponent } from '../../../../components/preview-post-card/preview-post-card.component';
import { IPostCardMeta } from '../../../../components/preview-post-card/preview-post-card.interface';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { AuthService } from '@auth/auth.service';
import { FormGroup } from '@angular/forms';
import { LinkifyPipe } from '@shared/pipes/linkify.pipe';
import { getAnnouncementRestTarget } from '@pages/announcements/utils/announcement-rest-target-map.util';

interface IViewModel extends IPostCardMeta {
  roleIds: ISelectValue[];
  targets: SchoolStructureControlItem[];
}
@Component({
  selector: 'app-create-post-preview',
  templateUrl: './create-post-preview.component.html',
  standalone: true,
  imports: [
    CommonModule,
    HesButtonModule,
    IonFooter,
    TranslocoModule,
    HesIconComponent,
    HesAttachmentPreviewComponent,
    IonSpinner,
    PreviewPostCardComponent,
    LinkifyPipe,
  ],
})
export class CreatePostPreviewComponent implements OnInit {
  @Input() postId: number;
  @Input() form: FormGroup;
  private modalControl = inject(ModalController);
  readonly viewModel = signal<IViewModel | null>(null);
  private readonly postFormStore = inject(PostFormStore);
  private readonly announcementService = inject(AnnouncementService);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly toasterService = inject(ToastrService);
  readonly loading = signal<boolean>(false);
  private readonly translocoService = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly user = computed(() => {
    return this.auth.user()!;
  });
  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'sm',
  };

  readonly schoolIcon: hesIcon = {
    src: 'assets/icons/school.svg',
  };
  constructor() {}

  ngOnInit() {
    this.mapFormToPreview();
  }

  mapFormToPreview() {
    this.viewModel.set(this.mapToPreview());
  }
  onSubmit() {
    this.loading.set(true);
    this.uploadImages()
      .pipe(
        switchMap((attachments) => {
          let payload: PostPayload = {
            ...this.getRestPayload(),
            ...(attachments?.length && {
              attachments: attachments.map((i) => i.key),
            }),
            type: 'post',
          };

          return this.savePost(payload);
        }),
        finalize(() => {
          this.loading.set(false);
        }),
      )

      .subscribe({
        next: () => {
          this.toasterService.success(
            '',
            this.translate('announcements.successfully_published_post_msg.txt'),
          );
          this.form.markAsPristine();
          this.router.navigate(['announcements/manage']);
          this.modalControl.dismiss();
        },
        error: () => {
          this.toasterService.error(
            '',
            this.translate('announcements.wrong_publish_post_msg.txt'),
          );
        },
      });
  }

  private getRestPayload() {
    const value = this.form.value;
    const postDetailForm = value.postDetailForm;
    const targetForm = value.targetForm;

    return {
      title: postDetailForm?.title!,
      content: postDetailForm?.content!,
      targets: getAnnouncementRestTarget(targetForm?.targetSchool),
      roleIds: targetForm?.targetRole || [],
      academicYearId: this.academicYearScope?.selectedAcademicYear()?.id!,
    };
  }

  uploadImages() {
    const attachments = this.form.value.postDetailForm?.attachments || [];
    return this.announcementService.upload(attachments);
  }

  getAlreadyUploadedFile() {
    const attachments = this.form.value.postDetailForm?.attachments || [];
    return attachments
      .filter(
        (
          file: IAttachmentControlValue,
        ): file is IAttachmentControlUploadedValue => 'url' in file,
      )
      .map((file: IAttachmentControlUploadedValue) => file.key);
  }

  mapToPreview(): IViewModel {
    const value = this.form.value;
    const { postDetailForm, targetForm } = value || {};
    return {
      title: postDetailForm?.title ?? '',
      content: postDetailForm?.content ?? '',
      attachments: postDetailForm?.attachments ?? [],
      targets: this.getSelectedSchoolStructure(
        targetForm?.targetSchool as unknown as SchoolStructureControlValue[],
      ),
      roleIds: this.getSelectedRole(
        targetForm?.targetRole as unknown as number[],
      ),
      createdBy: {
        id: this.user().id,
        displayName: this.user().displayName,
      },
      createdAt: new Date().toISOString(),
    };
  }

  getSelectedSchoolStructure(targets: Array<SchoolStructureControlValue>) {
    const result: SchoolStructureControlItem[] = [];
    const nodes = this.postFormStore.schoolStructure();
    if (Array.isArray(targets)) {
      targets.forEach((item) => {
        const found = findNodeInSchoolStructure(nodes, item);
        if (found) {
          result.push(found);
        }
      });
    }
    return result;
  }

  getSelectedRole(ids: Array<number>) {
    return this.postFormStore
      .roles()
      .filter((role) => ids.some((id) => role.value === id));
  }

  cancel() {
    this.modalControl.dismiss();
  }
  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  private savePost(payload: PostPayload) {
    if (this.postId) {
      return this.announcementService.updatePost(this.postId, payload);
    }
    return this.announcementService.createPost(payload);
  }

  removeAttachment(index: number) {
    const attachments = this.form.value.postDetailForm?.attachments;
    if (Array.isArray(attachments)) {
      attachments.splice(index, 1);
    }
  }
  removeTarget(target: SchoolStructureControlItem) {
    const targets = this.form.value.targetForm?.targetSchool;
    if (Array.isArray(targets)) {
      const newTargets = targets.filter(
        (item) => !(item.id === target.id && item.type === target.type),
      );
      this.form.patchValue({
        targetForm: {
          targetSchool: newTargets,
        },
      });
    }
    this.mapFormToPreview();
  }

  removeRole(role: ISelectValue) {
    const roles = this.form.value.targetForm?.targetRole;
    if (Array.isArray(roles)) {
      const newRoles = roles.filter((item) => item !== role.value);
      this.form.patchValue({
        targetForm: {
          targetRole: newRoles,
        },
      });
    }
    this.mapFormToPreview();
  }
}
