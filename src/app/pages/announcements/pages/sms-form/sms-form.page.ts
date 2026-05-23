import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
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
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { ReviewComponent } from '@pages/announcements/components/review/review.component';
import { HesAlertComponent } from '@ui-kit/hes-alert/hes-alert.component';
import {
  CountByRoleResponseDTO,
  GetSMSCostDTO,
  PostDataDTO,
} from '@pages/announcements/data-access/post.dto';
import { AnnouncementService } from '@pages/announcements/data-access/announcement.service';
import { CanFormComponentDeactivate } from '../../../../shared/guards/form-can-deactivate.guard';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { PostFormStore } from '../post-form/data-access/post-form.store';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { environment } from 'src/environments/environment';
import { InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import { Idropdown, IPagination } from '@shared/interfaces';
import { AnnouncementUserQueryParams } from '@pages/announcements/data-access/post.dto';
import { faUserTieHair } from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { de } from 'date-fns/locale';
import { isEqual } from 'lodash';
import { getAnnouncementRestTarget } from '@pages/announcements/utils/announcement-rest-target-map.util';

@Component({
  selector: 'app-sms-form',
  templateUrl: './sms-form.page.html',
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
    HesAlertComponent,
    FontAwesomeModule,
  ],
})
export class SmsFormPage implements OnInit, CanFormComponentDeactivate {
  englishSinglePartLimit = 160;
  englishMultiPartLimit = 153;
  arabicSinglePartLimit = 70;
  arabicMultiPartLimit = 67;
  englishTotalLimit = 1530; // Total character limit if all characters are Latin (English)
  arabicTotalLimit = 670; // Total character limit if any Arabic (non-Latin) character is detected
  totalLimit = this.englishTotalLimit; // This will switch between 1530 and 670 based on content
  currentCharCount = 0;
  messageCount = 0;
  specialChars: Set<string> = new Set([
    '{',
    '}',
    '[',
    ']',
    '^',
    '~',
    '\\',
    '|',
    '€',
  ]); // Special characters that take +2 in GSM-7 encoding

  smsId = input<number>();
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly modalCtrl = inject(ModalController);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly translocoService = inject(TranslocoService);
  private readonly announcementService = inject(AnnouncementService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly postFormStore = inject(PostFormStore);
  private readonly destroyRef = inject(DestroyRef);
  private roleBaseCountData = signal<CountByRoleResponseDTO['data']>([]);
  readonly step = signal<number>(0);
  readonly smsCostMessage = signal<SMSCostMessage | null>(null);
  readonly showUserSearchControl = signal<boolean>(false);
  readonly cashedUserList = new Map<number | string, UserListDropdown>();
  private readonly cd = inject(ChangeDetectorRef);
  form = this.fb.group({
    content: this.fb.control<string>('', Validators.required),
    targetForm: this.fb.group({
      targetSchool: this.fb.control<
        Array<{ id: number; type: SchoolStructureEntityType }>
      >([], Validators.required),
      targetRole: this.fb.control<number[]>([], Validators.required),
      user: this.fb.control<number[]>([]),
    }),
  });

  readonly selectedUserSignal = toSignal(
    this.form.controls.targetForm.controls.user.valueChanges,
  );
  readonly roleOptionsWithCount = computed<ISelectValue[]>(() => {
    const roles = this.postFormStore.roles();
    const countsData = this.roleBaseCountData();
    const selectedRole =
      this.form.controls.targetForm.controls.targetRole.value;
    const selectedUserIds = this.selectedUserSignal();
    if (
      selectedRole.length === 1 &&
      selectedUserIds &&
      selectedUserIds.length > 0
    ) {
      return roles.map((role) => {
        return {
          ...role,
          extraData:
            selectedRole[0] === role.value ? selectedUserIds.length : 0,
        };
      });
    }
    return roles.map((role) => {
      const count = countsData.find((c) => c.roleId === role.value)?.count;
      return {
        ...role,
        extraData: count,
      };
    });
  });

  readonly isMessageCountAvailable = computed<boolean>(() => {
    const roles = this.roleOptionsWithCount();
    return roles.some((role) => {
      return role.extraData > 0;
    });
  });

  private readonly specificPersonPage = signal<IPagination | undefined>(
    undefined,
  );
  private readonly specificPersonList = signal<UserListDropdown[]>([]);
  private readonly searchText = signal<string | undefined>(undefined);
  private readonly params = signal<Partial<AnnouncementUserQueryParams>>({
    pageNumber: 1,
    itemsPerPage: 10,
  });
  @ViewChild('customselectOption') public templateref: TemplateRef<any>;
  faUserTieHair = faUserTieHair;

  // This function is triggered on every input change in the textarea
  onInputChange = (content: any): void => {
    const { totalMessages, totalChars } = this.calculateMessages(content);
    this.currentCharCount = totalChars;
    this.messageCount = totalMessages;
    // If totalLimit is reached, form control content should be invalid
    this.form.controls.content.setErrors(
      totalChars > this.totalLimit ? { maxlength: true } : null,
    );
  };

  // Calculate messages and character count based on mixed content (both English/Arabic)
  calculateMessages = (
    content: string,
  ): {
    totalMessages: number;
    totalChars: number;
  } => {
    let totalChars = 0;
    const hasNonLatin = this.detectArabic(content); // Detect if the content contains Arabic or non-Latin characters

    for (const char of content) {
      if (char === ' ') {
        totalChars += 1; // Spaces count as +1
      } else if (char === '\n') {
        totalChars += 2; // Newlines count as +2
      } else if (this.isSpecialChar(char)) {
        totalChars += hasNonLatin ? 1 : 2; // Special characters count +1 if Arabic, otherwise +2
      } else {
        totalChars += 1; // Normal characters count as +1
      }
    }

    // If Arabic or non-Latin characters are detected, use the UCS-2 rules
    this.totalLimit = hasNonLatin
      ? this.arabicTotalLimit
      : this.englishTotalLimit;
    return hasNonLatin
      ? this.calculateNonLatinMessages(totalChars)
      : this.calculateLatinMessages(totalChars);
  };

  // Calculate the message count for Arabic or non-Latin content
  calculateNonLatinMessages = (
    totalChars: number,
  ): {
    totalMessages: number;
    totalChars: number;
  } => ({
    totalMessages:
      totalChars <= this.arabicSinglePartLimit
        ? 1
        : Math.ceil(totalChars / this.arabicMultiPartLimit),
    totalChars,
  });

  // Calculate the message count for Latin content
  calculateLatinMessages = (
    totalChars: number,
  ): {
    totalMessages: number;
    totalChars: number;
  } => ({
    totalMessages:
      totalChars <= this.englishSinglePartLimit
        ? 1
        : Math.ceil(totalChars / this.englishMultiPartLimit),
    totalChars,
  });

  // Check if any character is Arabic (or non-Latin) in the entire content
  detectArabic = (content: string): boolean => /[\u0600-\u06FF]/.test(content); // Returns true if any Arabic character is found

  // Check if a character is a special character that takes +2 spaces in GSM-7
  isSpecialChar = (char: string): boolean => this.specialChars.has(char);

  detailConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('global.content.label'),
        type: 'textarea',
        formControlName: 'content',
        required: true,
        placeholder: this.translate('announcements.enter_content.placeholder'),
      },
    ];
  });

  userSearchConfig = computed<IControl>(() => {
    return {
      label: this.translocoService.translate(
        'announcements.target_person.label',
      ),
      placeholder: this.translocoService.translate(
        'announcements.select_person.dropdown',
      ),
      type: 'searchable-select',
      selectValues: this.specificPersonList(),
      formControlName: 'user',
      required: false,
      isMultiple: true,
      searchableSelectObject: {
        pagination: this.specificPersonPage(),
        searchable: true,
        onloadMore: (ev: InfiniteScrollCustomEvent) => {
          this.params.update((params) => ({
            ...params,
            pageNumber: +params.pageNumber! + 1,
          }));
          this.fetchUsers({
            loadMore: true,
            event: ev,
            params: this.getUserParam(),
          });
        },
        showChips: true,
        showClearBtn: true,
        onSearchChanged: (value: string) => {
          this.params.update(({ searchText, ...restParams }) => ({
            ...restParams,
            ...(value && { searchText: value }),
            pageNumber: 1,
          }));
          this.fetchUsers({
            params: this.getUserParam(),
          });
        },
        selectOptionTemplate: this.templateref,
      },
    };
  });

  ngOnInit() {
    this.postFormStore.loadDataStructure();
    this.form.controls.targetForm.controls.user.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        withLatestFrom(
          this.form.controls.targetForm.controls.targetRole.valueChanges,
        ),
        filter(([_, rolesIds]) => rolesIds.length === 1),
        switchMap(([userIds, roleIds]) => {
          if (userIds.length === 0) {
            return this.getSMSCost(this.roleBaseCountData());
          } else {
            return this.getSMSCost([
              {
                roleId: roleIds[0],
                count: userIds.length,
              },
            ]);
          }
        }),
      )
      .subscribe();

    combineLatest([
      this.form.controls.targetForm.controls.targetRole.valueChanges,
      this.form.controls.targetForm.controls.targetSchool.valueChanges,
      this.form.controls.content.valueChanges,
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(500),
        distinctUntilChanged(isEqual),
        filter(([targetRole, targetSchool, content]) => {
          if (!content) {
            this.smsCostMessage.set(null);
            return false;
          }

          if (targetRole.length === 0) {
            this.showUserSearchControl.set(false);
            this.smsCostMessage.set(null);
            this.form.controls.targetForm.controls.user.reset();
            return false;
          }

          if (targetSchool.length === 0) {
            this.smsCostMessage.set(null);
            this.showUserSearchControl.set(false);
            this.form.controls.targetForm.reset();
            return false;
          }
          return true;
        }),
        tap(([targetRole, targetSchool]) => {
          const isShowUserSearchControl =
            !!targetSchool?.length && targetRole?.length === 1;
          this.showUserSearchControl.set(isShowUserSearchControl);

          if (!isShowUserSearchControl) {
            return;
          }
          this.params.update((params) => ({
            ...params,
            pageNumber: 1,
          }));
          this.form.controls.targetForm.controls.user.reset();
          this.fetchUsers({
            params: this.getUserParam({ targetRole, targetSchool }),
          });
        }),
        filter(
          ([targetRole, targetSchool]) =>
            !!targetSchool?.length && !!targetRole?.length,
        ),
        switchMap(([targetRole, targetSchool]) =>
          this.getCountByUserRoles({ targetRole, targetSchool }),
        ),
        switchMap((roleBaseCountResp) => this.getSMSCost(roleBaseCountResp)),
      )
      .subscribe();
    if (this.smsId()) {
      this.announcementService
        .getPostById(this.smsId()!, 'sms')
        .subscribe((resp) => {
          this.patchForm(resp.data);
        });
    }

    this.form.get('content')?.valueChanges.subscribe((value) => {
      this.onInputChange(value);
    });
  }

  patchForm(detail: PostDataDTO) {
    if (detail) {
      this.form.patchValue({
        content: detail?.content,
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
      component: ReviewComponent,
      cssClass: 'md-model',
      componentProps: {
        form: this.form,
        id: this.smsId(),
        type: 'sms',
        roleOptionsWithCount: this.roleOptionsWithCount,
        selectedUsersList: computed(() => this.selectedUserSignal()),
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

  onRechargeClick() {
    window.open(environment.SMS_RECHARGE_URL, '_blank');
  }

  private getSMSCostMessage(
    data: GetSMSCostDTO['data'] | null,
  ): SMSCostMessage | null {
    if (data == null) {
      return null;
    }
    const message = data.needRecharge
      ? this.translate('announcements.error_sms_balance_msg2.text')
      : this.translate('announcements.sms_balance_msg.text', {
          num: data.cost?.toFixed(2),
        });
    return {
      message,
      type: data.needRecharge ? 'error' : 'info',
    };
  }

  private getCountByUserRoles(value: Partial<TargetFormValue>) {
    return this.announcementService
      .getCountByRole({
        targets: getAnnouncementRestTarget(value?.targetSchool ?? []),
        roleIds: value?.targetRole ?? [],
        academicYearId:
          this.academicYearScopeService.selectedAcademicYear()?.id,
      })
      .pipe(
        catchError(() => of([])),
        tap((roleBaseCountData) => {
          this.roleBaseCountData.set(roleBaseCountData);
        }),
      );
  }

  private getSMSCost(roleBaseCountResp: CountByRoleResponseDTO['data']) {
    const userCount = roleBaseCountResp.reduce(
      (acc, curr) => acc + curr.count,
      0,
    );
    const { totalMessages } = this.calculateMessages(
      this.form.value.content ?? '0',
    );
    return this.announcementService
      .getSMSCost({
        messageCount: totalMessages,
        userCount,
      })
      .pipe(
        catchError(() => of(null)),
        tap((resp) => {
          this.smsCostMessage.set(this.getSMSCostMessage(resp));
        }),
      );
  }

  fetchUsers(args: {
    params: AnnouncementUserQueryParams;
    loadMore?: boolean;
    event?: InfiniteScrollCustomEvent;
  }) {
    const { loadMore = false, event, params } = args;
    this.announcementService.getAnouncementUsers(params).subscribe({
      next: (res) => {
        if (loadMore) {
          const nextList: any = res.data.map((n) => ({
            ...n,
            value: n.id,
            displayedValue: n.displayName,
            phoneNumber: `${n.countryCode}${n.phoneNumber}`,
          }));
          this.specificPersonList.update((list) => {
            return list.concat(nextList);
          });
          event?.target.complete();
        } else {
          const list: any = res.data.map((n) => ({
            ...n,
            value: {
              id: n.userId,
              phoneNumber: `${n.countryCode}${n.phoneNumber}`,
              roleId: n.roleId,
            },
            displayedValue: n.displayName,
            phoneNumber: `${n.countryCode}${n.phoneNumber}`,
          }));

          this.specificPersonList.set(list);
        }
        this.specificPersonPage.set(res.paginate);
        this.cachedUserList();
      },
      error: (err) => {
        this.specificPersonList.set([]);
        this.specificPersonPage.set(err.error.paginate);
      },
    });
  }

  private getPhoneNumberForRest(ids: Array<string | number>): string[] {
    const selectedUserPhoneList = new Set<string>();
    if (Array.isArray(ids)) {
      ids.forEach((id) => {
        const phoneNumber = this.cashedUserList.get(id)?.phoneNumber;
        if (phoneNumber) {
          selectedUserPhoneList.add(phoneNumber);
        }
      });
    }
    return Array.from(selectedUserPhoneList);
  }
  private cachedUserList() {
    this.specificPersonList().forEach((item) => {
      this.cashedUserList.set(item.value, item);
    });
  }

  private getUserParam(value?: {
    targetSchool: Array<{ id: number; type: SchoolStructureEntityType }>;
    targetRole: number[];
  }): AnnouncementUserQueryParams {
    const { targetSchool, targetRole } =
      value || this.form.controls.targetForm.value;
    return {
      ...this.params(),
      targets: getAnnouncementRestTarget(targetSchool ?? []),
      roleId: targetRole?.[0],
      arRoleName: this.postFormStore
        .roles()
        .find((role) => role.value === targetRole?.[0])?.extraData?.arName,
      academicYearId: this.academicYearScopeService.selectedAcademicYear()?.id,
    };
  }
}

interface SMSCostMessage {
  message: string;
  type: 'info' | 'error';
}

type TargetFormValue = {
  targetSchool: Array<{ id: number; type: SchoolStructureEntityType }>;
  targetRole: number[];
};

type UserListDropdown = Idropdown & { phoneNumber: string };
