import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IonContent, ModalController } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { HesStepperComponent } from '@ui-kit/hes-stepper/hes-stepper.component';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { PostTargetFormComponent } from '../../components/post-target-form/post-target-form.component';

import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';

interface IControlWithCharCount extends IControl {
  charCount: number;
  charLimit: number;
}
import { ReviewComponent } from '@pages/announcements/components/review/review.component';
import { AnnouncementService } from '@pages/announcements/data-access/announcement.service';
import { PostDataDTO } from '@pages/announcements/data-access/post.dto';
import { CanFormComponentDeactivate } from '../../../../shared/guards/form-can-deactivate.guard';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-notification-form',
  templateUrl: './notification-form.page.html',
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
    PostTargetFormComponent,
    FormControlGeneratorComponent,
  ],
})
export class NotificationFormPage
  implements OnInit, CanFormComponentDeactivate
{
  notificationId = input<number>();

  readonly titleMaxLength = 40;
  readonly contentMaxLength = 100;

  private readonly modalCtrl = inject(ModalController);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly translocoService = inject(TranslocoService);
  private readonly announcementService = inject(AnnouncementService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = signal<number>(0);
  readonly titleCharCount = signal<number>(0);
  readonly contentCharCount = signal<number>(0);

  initForm() {
    return this.fb.group({
      title: this.fb.control<string>('', [
        Validators.required,
        Validators.maxLength(this.titleMaxLength),
      ]),
      content: this.fb.control<string>('', [
        Validators.required,
        Validators.maxLength(this.contentMaxLength),
      ]),
      targetForm: this.fb.group({
        targetSchool: this.fb.control<
          Array<{ id: number; type: SchoolStructureEntityType }>
        >([], Validators.required),
        targetRole: this.fb.control<number[]>([], Validators.required),
      }),
    });
  }

  form = this.initForm();

  config = computed<IControlWithCharCount[]>(() => {
    return [
      {
        label: this.translate('global.title.label'),
        type: 'input',
        formControlName: 'title',
        required: true,
        placeholder: this.translate('global.enter_title.placeholder'),
        charCount: this.titleCharCount(),
        charLimit: this.titleMaxLength,
      },
      {
        label: this.translate('global.content.label'),
        type: 'textarea',
        formControlName: 'content',
        required: true,
        placeholder: this.translate('announcements.enter_content.placeholder'),
        charCount: this.contentCharCount(),
        charLimit: this.contentMaxLength,
      },
    ];
  });

  ngOnInit() {
    this.form.controls.title.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.titleCharCount.set(value?.length ?? 0);
      });

    this.form.controls.content.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.contentCharCount.set(value?.length ?? 0);
      });

    if (this.notificationId()) {
      this.announcementService
        .getPostById(this.notificationId()!, 'notification')
        .subscribe((resp) => {
          this.patchForm(resp.data);
        });
    }
  }

  patchForm(detail: PostDataDTO) {
    if (detail) {
      this.form.patchValue({
        title: detail.title,
        content: detail?.content,
        targetForm: {
          targetSchool: detail.targets.map((i) => ({
            id: i.entityId,
            type: i.parentId && i.type === 'company' ? 'sub-company' : i.type,
          })),
          targetRole: detail.targetRoles.map((item) => item.id),
        },
      });

      this.titleCharCount.set(detail.title?.length ?? 0);
      this.contentCharCount.set(detail.content?.length ?? 0);
    }
  }
  async onSubmit() {
    const modal = await this.modalCtrl.create({
      component: ReviewComponent,
      cssClass: 'md-model',
      componentProps: {
        form: this.form,
        id: this.notificationId(),
        type: 'notification',
      },
    });
    modal.present();
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  isUnsavedChanges() {
    return this.form.dirty;
  }

  onCancelClick() {
    this.router.navigate(['/announcements'], {
      relativeTo: this.route,
    });
  }
}
