import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Signal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import {
  IonFooter,
  IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { AnnouncementService } from '@pages/announcements/data-access/announcement.service';
import {
  AnnouncementUserDTO,
  PostPayload,
} from '@pages/announcements/data-access/post.dto';
import { PostFormStore } from '@pages/announcements/pages/post-form/data-access/post-form.store';
import { getAnnouncementRestTarget } from '@pages/announcements/utils/announcement-rest-target-map.util';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { FaIconComponentsProps, hesIcon } from '@shared/types';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import {
  SchoolStructureControlItem,
  SchoolStructureControlValue,
} from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { findNodeInSchoolStructure } from '@ui-kit/hes-school-structure-control/utils/find-node-in-school-structure.util';
import { finalize, map } from 'rxjs';
interface IViewModel {
  title: string;
  content: string;
  roleIds: ISelectValue[];
  targets: SchoolStructureControlItem[];
}

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  standalone: true,
  imports: [
    CommonModule,
    HesButtonModule,
    IonFooter,
    TranslocoModule,
    HesIconComponent,
    IonSpinner,
  ],
})
export class ReviewComponent {
  @Input() form: FormGroup;
  @Input() id: number;
  @Input() type: PostPayload['type'];
  @Input() roleOptionsWithCount: Signal<ISelectValue[]> | null;
  @Input() selectedUsersList = signal<AnnouncementUserDTO[]>([]);
  readonly loading = signal<boolean>(false);
  private readonly modalControl = inject(ModalController);
  private readonly postFormStore = inject(PostFormStore);
  private readonly announcementService = inject(AnnouncementService);
  private readonly translocoService = inject(TranslocoService);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly toasterService = inject(HesToasterService);
  private readonly router = inject(Router);
  readonly testSMSLoader = signal<boolean>(false);
  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'sm',
  };

  readonly schoolIcon: hesIcon = {
    src: 'assets/icons/school.svg',
  };

  readonly viewModel = computed<IViewModel>(() => {
    return this.mapToPreview();
  });

  mapToPreview(): IViewModel {
    const value = this.form.value;
    const { content, title, targetForm } = value || {};
    return {
      title: title,
      content: content ?? '',
      targets: this.getSelectedSchoolStructure(
        targetForm?.targetSchool as unknown as SchoolStructureControlValue[],
      ),
      roleIds: this.getSelectedRole(
        targetForm?.targetRole as unknown as number[],
      ),
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
    return (
      (this.roleOptionsWithCount != null
        ? this.roleOptionsWithCount()
        : this.postFormStore.roles()
      )?.filter((role) => ids.some((id) => role.value === id)) ?? []
    );
  }

  onSubmit() {
    this.loading.set(true);
    let payload: PostPayload = {
      ...this.getRestPayload(),
      type: this.type,
    };

    this.savePost(payload)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.toasterService.success(
            this.translate(
              this.isSms()
                ? 'announcements.successfully_published_sms_msg.txt'
                : 'announcements.successfully_published_notification_msg.txt',
            ),
          );
          this.form.markAsPristine();
          this.router.navigate(['announcements/manage']);
          this.modalControl.dismiss();
        },
        error: () => {
          this.toasterService.showGlobalWrongMessage(
            this.translate(
              this.isSms()
                ? 'announcements.wrong_publish_sms_msg.txt'
                : 'announcements.wrong_publish_notification_msg.txt',
            ),
          );
        },
      });
  }

  private getRestPayload() {
    const value = this.form.value;
    const targetForm = value.targetForm;

    return {
      ...(value.title && { title: value.title }),
      content: value.content!,
      targets: getAnnouncementRestTarget(targetForm.targetSchool),
      roleIds: targetForm?.targetRole || [],
      academicYearId: this.academicYearScope?.selectedAcademicYear()?.id!,
      ...(this.type === 'sms' &&
        this.selectedUsersList()?.length &&
        targetForm?.targetRole?.length === 1 && {
          specificPersonsList: this.selectedUsersList(),
        }),
    };
  }

  cancel() {
    this.modalControl.dismiss();
  }

  sendTestSMS(): void {
    this.testSMSLoader.set(true);
    this.announcementService.sendTestSMS(this.form.value.content).subscribe({
      next: () => {
        this.toasterService.success(
          this.translate('announcements.sms_successfully_sent_to_number.txt'),
        );
      },
      error: () => {
        this.toasterService.showGlobalWrongMessage();
      },
      complete: () => {
        this.testSMSLoader.set(false);
      },
    });
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  private savePost(payload: PostPayload) {
    if (this.id) {
      return this.announcementService.updatePost(this.id, payload);
    }
    return this.announcementService.createPost(payload);
  }

  private isSms() {
    return this.type === 'sms';
  }
}
