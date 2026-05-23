import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { DsButtonComponent } from 'src/app/design-system/button/button.component';
import { DsSchoolStructureControlComponent } from '@ds/school-structure-control/ds-school-structure-control.component';
import { DsSchoolStructureEntityType } from '@ds/school-structure-control/types/school-structure-control.types';
import { DsSchoolStructureControlValue } from '@ds/school-structure-control/types/school-structure-control.types';
import { DsSchoolStructureSelectionService } from '@ds/school-structure-control/ds-school-structure-selection.service';
import { StructureDepth } from '@shared/utils/school-structure';
import { SchoolStructureControlValue } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';

@Component({
  selector: 'app-school-structure-demo',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    ReactiveFormsModule,
    DsButtonComponent,
    DsSchoolStructureControlComponent,
    DemoPageWrapperComponent,
  ],
  templateUrl: './school-structure-demo.page.html',
})
export class SchoolStructureDemoPage {
  private readonly schoolStructureSelection = inject(
    DsSchoolStructureSelectionService,
  );

  structureDepth = StructureDepth;
  schoolOnlySelections: DsSchoolStructureEntityType[] = ['school'];
  schoolSearchTypes: DsSchoolStructureEntityType[] = [
    'company',
    'sub-company',
    'campus',
    'school',
  ];

  protected readonly selectionModalValue = signal<
    DsSchoolStructureControlValue[] | null
  >(null);

  protected readonly schoolOnlyModalValue = signal<
    DsSchoolStructureControlValue[] | null
  >(null);

  schoolStructureForm = new FormGroup({
    singleStructure: new FormControl<SchoolStructureControlValue[] | null>(
      null,
    ),
    multiStructure: new FormControl<SchoolStructureControlValue[] | null>(null),
    requiredStructure: new FormControl<SchoolStructureControlValue[] | null>(
      null,
      Validators.required,
    ),
    schoolDepthStructure: new FormControl<SchoolStructureControlValue[] | null>(
      null,
    ),
    schoolAllowedStructure: new FormControl<
      SchoolStructureControlValue[] | null
    >(null),
  });

  protected async openSchoolStructureSelection(): Promise<void> {
    const { data, role } = await this.schoolStructureSelection.open({
      initialSelection: this.selectionModalValue(),
      searchTypes: this.schoolSearchTypes,
      showSearch: true,
      requireSelection: true,
    });

    if (role === 'confirm' && Array.isArray(data)) {
      this.selectionModalValue.set(data);
    }
  }

  protected async openSchoolOnlySelection(): Promise<void> {
    const { data, role } = await this.schoolStructureSelection.open({
      initialSelection: this.schoolOnlyModalValue(),
      depth: StructureDepth.SCHOOL,
      allowedSelections: this.schoolOnlySelections,
      searchTypes: ['school'],
      showSearch: true,
      requireSelection: false,
      title: 'Select School',
    });

    if (role === 'confirm' && Array.isArray(data)) {
      this.schoolOnlyModalValue.set(data);
    }
  }
}
