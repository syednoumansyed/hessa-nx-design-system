import {
  Meta,
  StoryObj,
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular';
import { AfterViewInit, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { expect, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsInputComponent } from '@ds/input/input.component';
import {
  faEnvelope,
  faEye,
  faLock,
  faPhone,
  faSearch,
} from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'story-input-validation',
  standalone: true,
  imports: [ReactiveFormsModule, DsInputComponent],
  template: `
    <app-ds-input
      label="Email address"
      placeholder="name@school.edu.sa"
      dsType="email"
      [formControl]="emailControl"
      errorMessage="Please enter a valid email address"
      [required]="true"
    />
  `,
})
class StoryInputValidationComponent implements AfterViewInit {
  emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.emailControl.setValue('not-an-email');
      this.emailControl.markAsTouched();
      this.emailControl.updateValueAndValidity();
    });
  }
}

/**
 * # Input - `app-ds-input`
 *
 * Single-line text entry with label, hint, error message, prefix, icons,
 * loading state, character count, and `ControlValueAccessor` integration.
 */
const meta: Meta<DsInputComponent> = {
  title: '1. P0 Components/Input',
  component: DsInputComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    pseudo: { hover: ['app-ds-input'], focus: ['app-ds-input'] },
    docs: {
      description: {
        component:
          'Text input with reactive-form integration and direct `inputValue` support for non-form use cases. Use `DsTextareaComponent` for multi-line content.',
      },
    },
    a11y: { config: { rules: [{ id: 'label', enabled: true }] } },
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
    errorMessage: { control: 'text' },
    dsType: { control: 'select', options: ['text', 'number', 'tel', 'email'] },
    inputMode: {
      control: 'select',
      options: [
        'date',
        'datetime-local',
        'email',
        'month',
        'number',
        'numeric',
        'password',
        'search',
        'tel',
        'text',
        'time',
        'url',
        'week',
      ],
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    required: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    showCharacterCount: { control: 'boolean' },
    maxLength: { control: 'number' },
    prefix: { control: 'text' },
    showPrefix: { control: 'boolean' },
    inputValue: { control: 'text' },
  },
  decorators: [
    withHessaProviders(),
    moduleMetadata({
      imports: [
        DsInputComponent,
        ReactiveFormsModule,
        StoryInputValidationComponent,
      ],
    }),
    componentWrapperDecorator(
      (story) => `<div class="w-[360px] max-w-full p-ds-xl">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsInputComponent>;

export const Default: Story = {
  name: 'Default',
  args: {
    placeholder: 'Enter text',
  },
};

export const WithLabel: Story = {
  name: 'With label',
  args: {
    label: 'Full name',
    placeholder: 'Enter your name',
  },
};

export const WithHint: Story = {
  name: 'With hint text',
  args: {
    label: 'Full name',
    placeholder: 'Enter your name',
    hint: 'As it appears on your national ID',
  },
};

export const Error: Story = {
  name: 'State: Error via FormControl',
  render: () => ({
    template: `<story-input-validation />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Uses the real reactive-form path so the component receives invalid control status and renders the error message.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Please enter a valid email address'),
    ).toBeInTheDocument();
  },
};

export const ReadOnly: Story = {
  name: 'State: Read only',
  args: {
    label: 'Student ID',
    inputValue: 'STU-20240001',
    readOnly: true,
  },
};

export const Disabled: Story = {
  name: 'State: Disabled',
  args: {
    label: 'School name',
    placeholder: 'Unavailable',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText('School name')).toBeDisabled();
  },
};

export const Loading: Story = {
  name: 'State: Loading',
  args: {
    label: 'Username',
    placeholder: 'Checking availability',
    inputValue: 'ahmed.ali',
    loading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByLabelText('Loading')).toBeInTheDocument();
  },
};

export const WithIconStart: Story = {
  name: 'With icon (start)',
  args: {
    label: 'Search',
    placeholder: 'Search students',
    iconStart: faSearch,
  },
};

export const WithIconEnd: Story = {
  name: 'With icon (end)',
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    iconEnd: faEye,
  },
};

export const BothIcons: Story = {
  name: 'With both icons',
  args: {
    label: 'Email address',
    placeholder: 'name@school.edu.sa',
    dsType: 'email',
    iconStart: faEnvelope,
    iconEnd: faSearch,
  },
};

export const WithPrefix: Story = {
  name: 'With prefix',
  args: {
    label: 'Phone number',
    placeholder: '5XXXXXXXX',
    prefix: '+966',
    showPrefix: true,
    dsType: 'tel',
  },
};

export const CharacterCount: Story = {
  name: 'With character count',
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself',
    hint: 'Brief description shown on your profile',
    inputValue: 'Short bio',
    showCharacterCount: true,
    maxLength: 100,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('9/100')).toBeInTheDocument();
  },
};

export const TypeEmail: Story = {
  name: 'Type: email',
  args: {
    label: 'Email address',
    placeholder: 'name@school.edu.sa',
    dsType: 'email',
    inputMode: 'email',
    iconStart: faEnvelope,
  },
};

export const TypeTel: Story = {
  name: 'Type: tel',
  args: {
    label: 'Mobile number',
    placeholder: '05XXXXXXXX',
    dsType: 'tel',
    inputMode: 'tel',
    prefix: '+966',
    showPrefix: true,
    iconStart: faPhone,
  },
};

export const TypeNumber: Story = {
  name: 'Type: number',
  args: {
    label: 'Grade score',
    placeholder: '0-100',
    dsType: 'number',
    inputMode: 'numeric',
    maxLength: 3,
  },
};

export const Required: Story = {
  name: 'Required field',
  args: {
    label: 'Full name',
    placeholder: 'Enter your name',
    required: true,
    hint: 'This field is mandatory',
  },
};

export const Password: Story = {
  name: 'Type: password',
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    inputMode: 'password',
    iconStart: faLock,
    iconEnd: faEye,
  },
};

export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    label: 'Full name',
    placeholder: 'Enter your full name',
    hint: 'Required field',
    required: true,
  },
  decorators: [
    withHessaProviders({ locale: 'en' }),
    componentWrapperDecorator(
      (story) =>
        `<div class="w-[360px] max-w-full p-ds-xl" lang="en" dir="ltr">${story}</div>`,
    ),
  ],
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <div class="flex flex-col gap-ds-md" lang="ar" dir="rtl">
        <app-ds-input
          label="الاسم الكامل"
          placeholder="أدخل اسمك الكامل"
          hint="كما يظهر في الهوية"
          [required]="true"
        />
        <app-ds-input
          label="البريد الإلكتروني"
          placeholder="name@school.edu.sa"
          dsType="email"
        />
        <app-ds-input
          label="رقم الجوال"
          placeholder="05XXXXXXXX"
          dsType="tel"
          prefix="+966"
          [showPrefix]="true"
        />
      </div>
    `,
  }),
  decorators: [withHessaProviders({ locale: 'ar' })],
};

export const StudentRole: Story = {
  name: 'Student Role (tactile borders)',
  render: () => ({
    template: `
      <div class="flex flex-col gap-ds-md" data-role="student">
        <app-ds-input
          label="Full name"
          placeholder="Enter your name"
          hint="Required field"
        />
        <app-ds-input
          label="Email"
          placeholder="student@school.edu.sa"
          dsType="email"
        />
      </div>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div class="bg-pastels-brand-50 p-ds-xl" data-role="student">${story}</div>`,
    ),
  ],
};
