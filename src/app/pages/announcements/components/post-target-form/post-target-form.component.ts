import {
  Component,
  Input,
  OnInit,
  Signal,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PostFormStore } from '../../pages/post-form/data-access/post-form.store';
import { AnnouncementService } from '@pages/announcements/data-access/announcement.service';
import { AnnouncementRole } from '@pages/announcements/data-access/post.interface';

@Component({
  selector: 'app-post-target-form',
  templateUrl: './post-target-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormControlGeneratorComponent,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
})
export class PostTargetFormComponent implements OnInit {
  @Input({ required: true }) form: FormGroup;
  @Input() roleOptionsWithCount: Signal<ISelectValue[]> | null;
  @Input() announcementType: 'post' | 'notification' | 'sms' = 'post';

  private readonly translocoService = inject(TranslocoService);
  private readonly postFormStore = inject(PostFormStore);
  private readonly announcementService = inject(AnnouncementService);
  private readonly _announcementRoles = signal<ISelectValue[]>([]);
  private readonly _disabledRoleValues = signal<number[]>([]);

  formConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('announcements.target_schools.label'),
        type: 'school-structure',
        formControlName: 'targetSchool',
        required: true,
        isMultiple: true,
      },
      {
        label: this.translate('announcements.target_roles.label'),
        type: 'searchable-select',
        formControlName: 'targetRole',
        required: true,
        placeholder: this.translate('announcements.select_roles.dropdown'),
        selectValues:
          this.roleOptionsWithCount != null
            ? this.roleOptionsWithCount()
            : this._announcementRoles(),
        isMultiple: true,
        searchableSelectObject: {
          showClearBtn: false,
          disabledValues: this._disabledRoleValues(),
          formatSelectedValueInChipsFn: (value: ISelectValue) => {
            if (!value) {
              return '';
            }
            if (value.extraData != null) {
              return `${value.displayedValue} (${value.extraData})`;
            }
            return `${value.displayedValue}`;
          },
        },
      },
    ];
  });

  constructor() {
    // Watch for form value changes and prevent deselection of disabled roles
    effect(() => {
      const disabledRoles = this._disabledRoleValues();
      if (disabledRoles.length > 0) {
        const targetRoleControl = this.form.get('targetRole');
        if (targetRoleControl) {
          const currentValue = targetRoleControl.value || [];
          const hasAllDisabled = disabledRoles.every((roleId) =>
            currentValue.includes(roleId),
          );

          // If any disabled role is missing, add it back
          if (!hasAllDisabled) {
            const updatedValue = [
              ...new Set([...currentValue, ...disabledRoles]),
            ];
            targetRoleControl.setValue(updatedValue, { emitEvent: false });
          }
        }
      }
    });
  }

  ngOnInit() {
    this.postFormStore.loadDataStructure();
    this.loadRolesByType();
  }

  private loadRolesByType() {
    // Clear cached roles before loading new ones to prevent stale data
    this.postFormStore.clearRoles();

    let rolesObservable;

    switch (this.announcementType) {
      case 'post':
        rolesObservable = this.announcementService.getPostRoles();
        break;
      case 'notification':
        rolesObservable = this.announcementService.getNotificationRoles();
        break;
      case 'sms':
        rolesObservable = this.announcementService.getSMSRoles();
        break;
      default:
        rolesObservable = this.announcementService.getPostRoles();
    }

    rolesObservable.subscribe((response) => {
      const roles: ISelectValue[] = [];
      const disabledRoleIds: number[] = [];

      response.data.forEach((role: AnnouncementRole) => {
        // Add all roles to the dropdown
        roles.push({
          displayedValue: role.displayName,
          value: role.id,
        });

        // Track roles that should be disabled and pre-selected
        if (role.selected) {
          disabledRoleIds.push(role.id);
        }
      });

      this._announcementRoles.set(roles);
      this._disabledRoleValues.set(disabledRoleIds);

      // Update the PostFormStore with the loaded roles so preview component can access them
      this.postFormStore.setRoles(roles);

      // Pre-select disabled roles
      if (disabledRoleIds.length > 0) {
        const targetRoleControl = this.form.get('targetRole');
        if (targetRoleControl) {
          const currentRoleIds = targetRoleControl.value || [];
          const mergedRoleIds = [
            ...new Set([...currentRoleIds, ...disabledRoleIds]),
          ];
          targetRoleControl.setValue(mergedRoleIds);
        }
      }
    });
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
