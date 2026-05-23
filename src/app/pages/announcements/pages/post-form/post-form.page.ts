import { Component, OnInit, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HesStepperComponent } from '@ui-kit/hes-stepper/hes-stepper.component';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { IonContent } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { TranslocoDirective } from '@jsverse/transloco';
import { PostDetailFormComponent } from './components/post-detail-form/post-detail-form.component';
import { PostTargetFormComponent } from '../../components/post-target-form/post-target-form.component';
import { ModalController } from '@ionic/angular/standalone';
import { CreatePostPreviewComponent } from './components/create-post-preview/create-post-preview.component';
import { isMobile } from '@shared/utils/platform';
import { AnnouncementService } from '@pages/announcements/data-access/announcement.service';
import { PostDataDTO } from '@pages/announcements/data-access/post.dto';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { CanFormComponentDeactivate } from '../../../../shared/guards/form-can-deactivate.guard';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-post-form',
  templateUrl: './post-form.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HesStepperComponent,
    CdkStepperModule,
    HesButtonModule,
    TranslocoDirective,
    PostDetailFormComponent,
    PostTargetFormComponent,
  ],
})
export class PostFormPage implements OnInit, CanFormComponentDeactivate {
  postId = input<number>();
  readonly step = signal<number>(0);
  private readonly postApiService = inject(AnnouncementService);
  private readonly modalCtrl = inject(ModalController);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly isMobile = isMobile();
  private readonly fb = inject(NonNullableFormBuilder);
  readonly form = this.fb.group({
    postDetailForm: this.fb.group({
      title: this.fb.control<string>('', Validators.required),
      content: this.fb.control<string>('', Validators.required),
      attachments: this.fb.control<Array<IAttachmentControlValue>>([]),
    }),
    targetForm: this.fb.group({
      targetSchool: this.fb.control<
        Array<{ id: number; type: SchoolStructureEntityType }>
      >([], Validators.required),
      targetRole: this.fb.control<number[]>([], Validators.required),
    }),
  });

  ngOnInit() {
    this.form.reset();
    if (this.postId()) {
      this.postApiService
        .getPostById(this.postId()!, 'post')
        .subscribe((resp) => {
          this.patchForm(resp.data);
        });
    }
  }

  patchForm(detail: PostDataDTO) {
    if (detail) {
      this.form.patchValue({
        postDetailForm: {
          title: detail?.title,
          content: detail?.content,
          attachments: detail.attachments,
        },
        targetForm: {
          targetSchool: detail.targets.map((i) => ({
            id: i.entityId,
            type: i.parentId && i.type === 'company' ? 'sub-company' : i.type,
          })),
          targetRole: detail.targetRoles.map((item) => item.id),
        },
      });
    }
  }

  async onSubmit() {
    const modal = await this.modalCtrl.create({
      component: CreatePostPreviewComponent,
      cssClass: `xl-modal ${this.isMobile ? 'respect-safe-area' : 'overflow-y-auto'}`,
      componentProps: {
        postId: this.postId(),
        form: this.form,
      },
      ...(this.isMobile && {
        initialBreakpoint: 1,
        breakpoints: [0.75, 1],
      }),
    });
    modal.present();
  }

  checkForValidation() {}

  isUnsavedChanges() {
    return this.form.dirty;
  }

  onCancelClick() {
    this.router.navigate(['/announcements'], {
      relativeTo: this.route,
    });
  }
}
