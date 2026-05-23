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
import { CompanyService } from '@pages/school-structure/pages/company/company.service';
import { ICampusPayload, Idropdown } from '@shared/interfaces';
import {
  ICity,
  ICountry,
  IDistrict,
} from '@shared/interfaces/company.interface';
import { Language } from '@shared/enums';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { noWhitespaceValidator } from '@utils/custom.validator';
import {
  latitudeValidator,
  longitudeValidator,
} from '@validators/cordinatesValidator';
import { Campus } from '@shared/dto-transformation/organization';

interface companyDetails {
  id: number;
  name: string;
}

@Component({
  selector: 'app-add-edit-campus-dialog',
  templateUrl: './add-edit-campus-dialog.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    CommonModule,
    FormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
    HesButtonModule,
  ],
})
export class AddEditCampusDialogComponent implements OnInit {
  faClose = faClose;
  currentLang: string = '';

  private citiesDropdown = signal<Idropdown[]>([]);
  private districtsDropdown = signal<Idropdown[]>([]);
  private countriesDropdown = signal<Idropdown[]>([]);
  isEditModal = signal<boolean>(false);
  companyData = signal<companyDetails>({ id: 0, name: '' });

  @Input() closeModal: () => void;
  @Input() refreshCompanyDetail: () => void;
  @Input() campusDetails: Campus;
  @Input() companyDetails: companyDetails;

  constructor(
    private fb: FormBuilder,
    private nonNullablefb: NonNullableFormBuilder,
    private translocoService: TranslocoService,
    private companyService: CompanyService,
    private toastr: HesToasterService,
  ) {
    this.currentLang = this.translocoService.getActiveLang();
  }

  campusForm = this.fb.group({
    companyName: this.nonNullablefb.control('', Validators.required),
    arName: this.nonNullablefb.control('', [
      Validators.required,
      Validators.maxLength(50),
      noWhitespaceValidator,
    ]),
    enName: this.nonNullablefb.control('', [
      Validators.required,
      Validators.maxLength(50),
      noWhitespaceValidator,
    ]),
    phoneNumber: this.nonNullablefb.control('', Validators.required),
    country: this.fb.control<any>('', Validators.required),
    city: this.fb.control<string>('', Validators.required),
    district: this.fb.control<string>('', Validators.required),
    website: this.nonNullablefb.control('', [
      Validators.pattern(
        /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
      ),
    ]),
    latitude: this.fb.control<string | null>(null, [latitudeValidator()]),
    longitude: this.fb.control<string | null>(null, [longitudeValidator()]),
    description: this.nonNullablefb.control(''),
  });

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  campusForm1Config = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('school_structure.company_name.label'),
        placeholder: this.translate(
          'school_structure.company_name.placeholder',
        ),
        type: 'input',
        formControlName: 'companyName',
        required: true,
        readonly: true,
      },

      {
        label: this.translate('school_structure.campus_name_en.label'),
        placeholder: this.translate('school_structure.campus_name.placeholder'),
        type: 'input',
        formControlName: 'enName',
        required: true,
        errorMessage: {
          uniqueNameError: this.translate(
            'global.campus_name_already_exists.txt',
          ),
        },
      },
      {
        label: this.translate('school_structure.campus_name_ar.label'),
        placeholder: this.translate('school_structure.campus_name.placeholder'),
        type: 'input',
        formControlName: 'arName',
        required: true,
        errorMessage: {
          uniqueNameError: this.translate(
            'global.campus_name_already_exists.txt',
          ),
        },
      },
      {
        label: this.translate('global.phone_number.label'),
        placeholder: this.translate('global.phone_number.placeholder'),
        type: 'input',
        formControlName: 'phoneNumber',
        required: true,
        inputType: 'tel',
        maxLength: 9,
      },
      {
        label: this.translate('school_structure.country_req.label'),
        placeholder: this.translate('school_structure.select_country.dropdown'),
        type: 'searchable-select',
        formControlName: 'country',
        selectValues: this.countriesDropdown(),
        required: true,
      },
      {
        label: this.translate('school_structure.city_req.label'),
        placeholder: this.translate('school_structure.select_city.dropdown'),
        type: 'searchable-select',
        formControlName: 'city',
        selectValues: this.citiesDropdown(),
        required: true,
        onValueChange: this.onCityChange,
      },
      {
        label: this.translate('school_structure.district_req.label'),
        placeholder: this.translate(
          'school_structure.select_district.dropdown',
        ),
        type: 'searchable-select',
        formControlName: 'district',
        selectValues: this.districtsDropdown(),
        required: true,
      },
      {
        label: this.translate('school_structure.latitude.label'),
        placeholder: this.translate('school_structure.latitude.placeholder'),
        type: 'input',
        inputType: 'text',
        formControlName: 'latitude',
        required: false,
      },
      {
        label: this.translate('school_structure.longitude.label'),
        placeholder: this.translate('school_structure.longitude.placeholder'),
        type: 'input',
        inputType: 'text',
        formControlName: 'longitude',
        required: false,
      },
    ];
  });

  campusForm2Config = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('school_structure.campus_website.label'),
        placeholder: this.translate(
          'school_structure.campus_website.placeholder',
        ),
        type: 'input',
        formControlName: 'website',
        required: false,
      },
      {
        label: this.translate('global.description.label'),
        placeholder: this.translate(
          'school_structure.campus_description.placeholder',
        ),
        type: 'textarea',
        formControlName: 'description',
        required: false,
      },
    ];
  });

  ngOnInit() {
    this.isEditModal.set(this.campusDetails === null ? false : true);
    this.getCountries();
    this.getCities();
    this.companyData.set(this.companyDetails);
    this.campusForm.patchValue({
      companyName: this.companyData().name,
    });
    if (this.isEditModal()) {
      this.setEditValues();
    }
  }

  getCountries() {
    this.companyService.getCountries().subscribe({
      next: (countries: ICountry[]) => {
        const dropdownOptions = countries.map((country: ICountry) => ({
          value: country.name_en,
          displayedValue:
            this.currentLang === Language.ARABIC
              ? country.name_ar
              : country.name_en,
        }));
        this.countriesDropdown.set(dropdownOptions);
        this.campusForm.patchValue({
          country: this.countriesDropdown()[0].value,
        });
      },
    });
  }

  /**
   * Sets the form control values for the edit campus modal.
   */
  setEditValues() {
    this.getDistricts(this.campusDetails.city);
    this.campusForm.patchValue({
      arName: this.campusDetails.arName ?? '',
      enName: this.campusDetails.enName ?? '',
      phoneNumber: this.campusDetails.phoneNumber,
      country: this.campusDetails.country,
      city: this.campusDetails.city,
      district: this.campusDetails.district,
      website: this.campusDetails.website ?? '',
      description: this.campusDetails.description ?? '',
      latitude: this.campusDetails.latitude?.toString() ?? null,
      longitude: this.campusDetails.longitude?.toString() ?? null,
    });
  }

  /**
   * Handles the change event of the city dropdown.
   * Retrieves the districts based on the selected city and resets the district form control.
   *
   * @param event - The selected city value.
   */
  onCityChange = (event: string) => {
    this.getDistricts(event);
    this.campusForm.get('district')?.reset();
  };

  /**
   * Retrieves the list of cities from the company service.
   * @returns An Observable that emits an array of cities.
   */
  getCities() {
    return this.companyService.getCities().subscribe({
      next: (cities: ICity[]) => {
        const dropdownOptions = cities.map((city: ICity) => ({
          value: city.name_en,
          displayedValue:
            this.currentLang === Language.ARABIC ? city.name_ar : city.name_en,
        }));
        this.citiesDropdown.set(dropdownOptions);
      },
    });
  }

  /**
   * Retrieves the districts based on the provided city name.
   * @param name - The name of the city.
   * @returns An Observable that emits an array of districts.
   */
  getDistricts(name: string) {
    return this.companyService.getCities().subscribe({
      next: (cities: ICity[]) => {
        const city = cities.find((city: ICity) => city.name_en === name);
        if (!city) return;
        const id = city.city_id;
        this.companyService.getDistricts().subscribe({
          next: (districts: IDistrict[]) => {
            const filteredDistricts = districts.filter(
              (district: IDistrict) => district.city_id === id,
            );
            const dropdownOptions = filteredDistricts.map(
              (district: IDistrict) => ({
                value: district.name_en,
                displayedValue:
                  this.currentLang === Language.ARABIC
                    ? district.name_ar
                    : district.name_en,
              }),
            );
            this.districtsDropdown.set(dropdownOptions);
          },
        });
      },
    });
  }

  /**
   * Makes the campus payload for adding or editing campus.
   * @returns ICampusPayload
   */
  makeCampusPayload() {
    const formValues = this.campusForm.getRawValue();
    const payload = {
      countryCode: '+966',
    } as ICampusPayload;
    if (!this.isEditModal()) payload['companyId'] = this.companyData().id;
    if (formValues.enName) payload['enName'] = formValues.enName;
    if (formValues.arName) payload['arName'] = formValues.arName;
    if (formValues.phoneNumber) payload['phoneNumber'] = formValues.phoneNumber;
    if (formValues.country) payload['country'] = formValues.country;
    if (formValues.city) payload['city'] = formValues.city;
    if (formValues.district) payload['district'] = formValues.district;
    if (formValues.website) payload['website'] = formValues.website;
    if (formValues.description) payload['description'] = formValues.description;
    if (formValues.latitude) payload['latitude'] = +formValues.latitude;
    if (formValues.longitude) payload['longitude'] = +formValues.longitude;
    return payload;
  }

  /**
   * Handles the add campus functionality.
   */
  onAddCampus() {
    const payload: ICampusPayload = this.makeCampusPayload();
    return this.companyService.createCampus(payload).subscribe({
      next: (_res) => {
        this.closeModal();
        this.refreshCompanyDetail();
        this.toastr.success(
          this.translate('school_structure.campus_added_successfully_msg.txt'),
        );
      },
      error: (err) => {
        if (err.status === 422) {
          this.campusForm.get('name')?.setErrors({ uniqueNameError: true });
          this;
        } else {
          this.toastr.showBackendError(err);
        }
      },
    });
  }

  /**
   * Handles the edit campus functionality.
   */
  onEditCampus() {
    const payload: ICampusPayload = this.makeCampusPayload();
    return this.companyService
      .updateCampus(this.campusDetails.id, payload)
      .subscribe({
        next: (res) => {
          this.closeModal();
          this.refreshCompanyDetail();
          this.toastr.success(
            this.translate('school_structure.campus_updated_successfully.txt'),
          );
        },
        error: (err) => {
          if (err.status === 422) {
            this.campusForm.get('name')?.setErrors({ uniqueNameError: true });
          } else {
            this.toastr.showBackendError(err);
          }
        },
      });
  }
}
