import { Component, Input, computed, signal, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormBuilder,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { faClose } from '@fortawesome/pro-solid-svg-icons';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { SchoolService } from '@pages/school-structure/pages/school/school.service';
import { Idropdown } from '@shared/interfaces';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { Level, School } from '@shared/dto-transformation/organization';

@Component({
  selector: 'app-add-edit-level-dialog',
  templateUrl: './add-edit-level-dialog.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    HesButtonModule,
    CommonModule,
    FormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class AddEditLevelDialogComponent implements OnInit {
  faClose = faClose;
  currentLang: string = '';

  private levelsDropdown = signal<Idropdown[]>([]);
  private schoolLevels: number[] = [];

  isEditModal = signal<boolean>(false);
  @Input() closeModal: () => void;
  @Input() refreshSchoolDetails: () => void;
  @Input() schoolDetails: School;

  constructor(
    private fb: FormBuilder,
    private nonNullablefb: NonNullableFormBuilder,
    private translocoService: TranslocoService,
    private schoolService: SchoolService,
    private toastr: HesToasterService,
  ) {
    this.currentLang = this.translocoService.getActiveLang();
  }

  levelForm = this.fb.group({
    schoolName: this.nonNullablefb.control('', Validators.required),
    level: this.nonNullablefb.control([] as number[]),
  });

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  getLevels() {
    return this.schoolService.getLevels().subscribe({
      next: (data) => {
        const dropdownOptions = data
          .filter((level: Level) => {
            return !this.schoolLevels.includes(level.id);
          })
          .map((level: Level) => ({
            value: level.id,
            displayedValue: level.displayName,
          }));

        this.levelsDropdown.set(dropdownOptions);
        this.levelForm.patchValue({
          schoolName: this.schoolDetails.displayName,
        });
      },
    });
  }

  levelFormConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('school_structure.school_name_req.label'),
        type: 'input',
        formControlName: 'schoolName',
        required: false,
        readonly: true,
      },
      {
        label: this.translate('global.levels.label'),
        placeholder: this.translate('global.select_level.dropdown'),
        type: 'searchable-select',
        formControlName: 'level',
        selectValues: this.levelsDropdown(),
        required: false,
        isMultiple: true,
      },
    ];
  });

  ngOnInit() {
    this.isEditModal.set(this.schoolDetails === null ? false : true);
    this.schoolLevels =
      this.schoolDetails.schoolLevels?.map((level) => level.id) ?? [];

    this.getLevels();
  }

  /**
   * Makes the school payload for adding or editing school.
   * @returns ISchoolPayload
   */
  makeLevelPayload() {
    const formValues = this.levelForm.getRawValue();
    return {
      levelIds: [...this.schoolLevels, ...formValues.level],
    };
  }

  onUpdateLevels() {
    const payload = this.makeLevelPayload();
    return this.schoolService
      .updateSchoolLevels(this.schoolDetails.id, payload)
      .subscribe({
        next: (res) => {
          this.closeModal();
          this.refreshSchoolDetails();
          this.toastr.success(
            this.translate(
              'school_structure.school_levels_updated_successfully.txt',
            ),
          );
        },
        error: (err) => {
          this.toastr.showBackendError(err);
        },
      });
  }
}
