import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import {
  faShieldCheck,
  faFlask,
  faCalculator,
  faLanguage,
  faPalette,
} from '@fortawesome/pro-solid-svg-icons';
import {
  DsFormRendererComponent,
  FormControlConfig,
} from '@shared/components/ds-form-control-generator/ds-form-renderer/ds-form-renderer.component';
import { DsButtonComponent } from 'src/app/design-system/button/button.component';
import { DsPickerSelectComponent } from '@ds/picker-select';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';

@Component({
  selector: 'app-form-renderer-demo',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    ReactiveFormsModule,
    DsFormRendererComponent,
    DsButtonComponent,
    DsPickerSelectComponent,
    DemoPageWrapperComponent,
  ],
  templateUrl: './form-renderer-demo.page.html',
})
export class FormRendererDemoPage {
  formRendererDemoForm = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl(''),
    bio: new FormControl(''),
    country: new FormControl(''),
    city: new FormControl(''),
    profileIcon: new FormControl<string | null>(null, Validators.required),
    visibility: new FormControl([]),
    notifications: new FormControl(false),
    privacyMode: new FormControl(false),
    lessons: new FormControl<string[]>([], Validators.required),
    singleLesson: new FormControl<string | null>(null),
    preSelectedLessons: new FormControl<string[]>(['lesson1', 'lesson3']),
    disabledPicker: new FormControl<string[]>(['lesson2']),
    educationalPath: new FormControl<string | null>(null, Validators.required),
    domain: new FormControl<string[]>([]),
  });

  localizedPairDemoForm = new FormGroup({
    enTitle: new FormControl('', Validators.required),
    arTitle: new FormControl('', Validators.required),
    enDescription: new FormControl(''),
    arDescription: new FormControl(''),
  });

  localizedPairConfig: FormControlConfig[] = [
    {
      type: 'input',
      formControlName: 'enTitle',
      label: 'Title (English)',
      placeholder: 'Enter title in English',
      required: true,
      row: 'title',
      maxLength: 30,
      showCharacterCount: true,
    },
    {
      type: 'input',
      formControlName: 'arTitle',
      label: 'Title (Arabic)',
      placeholder: 'Enter title in Arabic',
      required: true,
      row: 'title',
      maxLength: 30,
      showCharacterCount: true,
    },
    {
      type: 'input',
      formControlName: 'enDescription',
      label: 'Description (English)',
      placeholder: 'Enter description in English',
      localizedPair: 'arDescription',
      maxLength: 60,
      showCharacterCount: true,
    },
    {
      type: 'input',
      formControlName: 'arDescription',
      label: 'Description (Arabic)',
      placeholder: 'Enter description in Arabic',
      localizedPair: 'enDescription',
      maxLength: 60,
      showCharacterCount: true,
    },
  ];

  formRendererConfig: FormControlConfig[] = [
    {
      type: 'input',
      formControlName: 'firstName',
      label: 'First Name',
      placeholder: 'Enter first name',
      required: true,
      row: 'name',
    },
    {
      type: 'input',
      formControlName: 'lastName',
      label: 'Last Name',
      placeholder: 'Enter last name',
      required: true,
      row: 'name',
    },
    {
      type: 'input',
      formControlName: 'email',
      label: 'Email Address',
      placeholder: 'you@example.com',
      required: true,
      helperText: 'We will never share your email with anyone else.',
    },
    {
      type: 'input',
      formControlName: 'phone',
      label: 'Phone Number',
      placeholder: '+1 (555) 000-0000',
      row: 'contact',
    },
    {
      type: 'input',
      formControlName: 'country',
      label: 'Country',
      placeholder: 'Select country',
      row: 'contact',
    },
    {
      type: 'input',
      formControlName: 'city',
      label: 'City',
      placeholder: 'Enter your city',
      helperText: 'Optional field for location-based services.',
    },
    {
      type: 'textarea',
      formControlName: 'bio',
      label: 'Bio',
      placeholder: 'Tell us about yourself...',
      helperText: 'Max 500 characters.',
      maxLength: 500,
    },
    {
      type: 'icon-chooser',
      formControlName: 'profileIcon',
      label: 'Profile Icon',
      helperText: 'Choose an icon to represent your profile.',
      required: true,
    },
    {
      type: 'checkbox',
      formControlName: 'visibility',
      label: 'Visibility Settings',
      size: 'sm',
      selectValues: [
        { value: 'showProfile', displayedValue: 'Show Profile Publicly' },
        { value: 'showEmail', displayedValue: 'Show Email to Others' },
      ],
    },
    {
      type: 'checkbox',
      formControlName: 'notifications',
      helperText: 'You will receive updates about new features and promotions.',
      size: 'sm',
      selectValues: [
        {
          value: 'notifications',
          displayedValue: 'Enable Email Notifications',
        },
      ],
    },
    {
      type: 'checkbox',
      formControlName: 'privacyMode',
      helperText: 'Your activity will be hidden from other users.',
      size: 'sm',
      selectValues: [
        {
          value: 'privacyMode',
          displayedValue: 'Enable Privacy Mode',
          icon: { name: faShieldCheck, placement: 'end' },
        },
      ],
    },
    {
      type: 'picker-select',
      formControlName: 'lessons',
      label: 'Select Lessons (Multi)',
      placeholder: 'Select lessons',
      itemLabel: 'lessons',
      selectButtonText: 'Select',
      isMultiple: true,
      required: true,
      helperText: 'Choose one or more lessons.',
      selectValues: [
        { value: 'lesson1', displayedValue: 'Cell Structures and Functions' },
        { value: 'lesson2', displayedValue: 'Cell Division' },
        { value: 'lesson3', displayedValue: 'Cell Membrane and Transport' },
        { value: 'lesson4', displayedValue: 'Cellular Respiration' },
        { value: 'lesson5', displayedValue: 'Photosynthesis' },
        { value: 'lesson6', displayedValue: 'DNA and RNA' },
        { value: 'lesson7', displayedValue: 'Protein Synthesis' },
        { value: 'lesson8', displayedValue: 'Genetics and Heredity' },
        { value: 'lesson9', displayedValue: 'Evolution and Natural Selection' },
        { value: 'lesson10', displayedValue: 'Ecosystems and Biodiversity' },
        { value: 'lesson11', displayedValue: 'Human Anatomy' },
        { value: 'lesson12', displayedValue: 'Plant Biology' },
        { value: 'lesson13', displayedValue: 'Microbiology' },
        { value: 'lesson14', displayedValue: 'Biochemistry Fundamentals' },
        { value: 'lesson15', displayedValue: 'Molecular Biology' },
        { value: 'lesson16', displayedValue: 'Cell Signaling Pathways' },
      ],
      row: 'picker-row',
    },
    {
      type: 'picker-select',
      formControlName: 'singleLesson',
      label: 'Select Lesson (Single)',
      placeholder: 'Choose one lesson',
      itemLabel: 'lesson',
      selectButtonText: 'Confirm',
      isMultiple: false,
      selectValues: [
        { value: 'lesson1', displayedValue: 'Cell Structures and Functions' },
        { value: 'lesson2', displayedValue: 'Cell Division' },
        { value: 'lesson3', displayedValue: 'Cell Membrane and Transport' },
        { value: 'lesson4', displayedValue: 'Cellular Respiration' },
      ],
      row: 'picker-row',
    },
    {
      type: 'picker-select',
      formControlName: 'preSelectedLessons',
      label: 'Pre-selected Lessons',
      placeholder: 'Select lessons',
      itemLabel: 'lessons',
      isMultiple: true,
      helperText: 'This field has pre-selected values and one disabled option.',
      selectValues: [
        {
          value: 'lesson1',
          displayedValue: 'Cell Structures and Functions',
          disabled: true,
        },
        { value: 'lesson2', displayedValue: 'Cell Division', disabled: true },
        { value: 'lesson3', displayedValue: 'Cell Membrane and Transport' },
        { value: 'lesson4', displayedValue: 'Cellular Respiration' },
      ],
      row: 'picker-row-2',
    },
    {
      type: 'picker-select',
      formControlName: 'disabledPicker',
      label: 'Disabled Picker',
      placeholder: 'Select lessons',
      itemLabel: 'lessons',
      isMultiple: true,
      disabled: true,
      helperText: 'This picker is disabled.',
      selectValues: [
        { value: 'lesson1', displayedValue: 'Cell Structures and Functions' },
        { value: 'lesson2', displayedValue: 'Cell Division' },
      ],
      row: 'picker-row-2',
    },
    {
      type: 'chip-selector',
      formControlName: 'educationalPath',
      label: 'Educational Path',
      helperText: 'Select one educational path. "Special" is disabled.',
      isMultiple: false,
      required: true,
      selectValues: [
        { value: 'general', displayedValue: 'General' },
        { value: 'advanced', displayedValue: 'Advanced' },
        { value: 'special', displayedValue: 'Special', disabled: true },
      ],
      row: 'chip-row',
    },
    {
      type: 'chip-selector',
      formControlName: 'domain',
      label: 'Domain',
      helperText: 'Select one or more domains (with icons).',
      isMultiple: true,
      selectValues: [
        {
          value: 'science',
          displayedValue: 'Science',
          icon: { name: faFlask, placement: 'start' },
        },
        {
          value: 'math',
          displayedValue: 'Math',
          icon: { name: faCalculator, placement: 'start' },
        },
        {
          value: 'language',
          displayedValue: 'Language',
          icon: { name: faLanguage, placement: 'start' },
        },
        {
          value: 'arts',
          displayedValue: 'Arts',
          icon: { name: faPalette, placement: 'start' },
        },
      ],
      row: 'chip-row',
    },
  ];
}
