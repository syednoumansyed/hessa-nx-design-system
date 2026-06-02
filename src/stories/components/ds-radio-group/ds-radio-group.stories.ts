import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { AfterViewInit, Component } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsRadioComponent } from '@ds/radio-button/radio/radio.component';
import { DsRadioGroupComponent } from '@ds/radio-button/radio-group/radio-group.component';

@Component({
  selector: 'story-radio-group-validation',
  standalone: true,
  imports: [ReactiveFormsModule, DsRadioComponent, DsRadioGroupComponent],
  template: `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <app-ds-radio-group
        [formControl]="choiceControl"
        [required]="true"
        style="display:flex;flex-direction:column;gap:12px;"
      >
        <app-ds-radio title="Yes" value="yes" size="lg"></app-ds-radio>
        <app-ds-radio title="No" value="no" size="lg"></app-ds-radio>
      </app-ds-radio-group>
      @if (choiceControl.touched && choiceControl.hasError('required')) {
        <span role="alert" style="color:#ef4444;font-size:13px;">
          Choose one option.
        </span>
      }
    </div>
  `,
})
class StoryRadioGroupValidationComponent implements AfterViewInit {
  choiceControl = new FormControl<string | null>(null, Validators.required);

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.choiceControl.markAsTouched();
      this.choiceControl.updateValueAndValidity();
    });
  }
}

/**
 * # Radio Group — `app-ds-radio-group` + `app-ds-radio`
 *
 * Mutually exclusive selection. Radio group queries child `app-ds-radio` components
 * and manages single-selection state. Implements `ControlValueAccessor`.
 *
 * **When to use:** Pick exactly one from 2–6 options when all options should be visible.
 * **When NOT to use:** 7+ options → use `ds-select`. Multiple selections → use `ds-checkbox-group`.
 */
const meta: Meta<DsRadioGroupComponent> = {
  title: '1. P0 Components/Radio Group',
  component: DsRadioGroupComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    a11y: { config: { rules: [{ id: 'label', enabled: true }] } },
  },
  argTypes: {
    required: {
      control: 'boolean',
      description:
        'Marks the radio group invalid until one child radio is selected.',
    },
  },
  decorators: [
    withHessaProviders(),
    moduleMetadata({
      imports: [
        DsRadioComponent,
        DsRadioGroupComponent,
        FormsModule,
        ReactiveFormsModule,
        StoryRadioGroupValidationComponent,
      ],
    }),
    componentWrapperDecorator(
      (story) => `<div style="padding:16px;">${story}</div>`,
    ),
  ],
};

export default meta;
type Story = StoryObj<DsRadioGroupComponent>;

export const Default: Story = {
  render: () => ({
    props: {
      selectedControl: new FormControl<string | null>(null),
    },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-radio-group [formControl]="selectedControl" style="display:flex;flex-direction:column;gap:12px;">
          <app-ds-radio title="Male" value="male" size="lg"></app-ds-radio>
          <app-ds-radio title="Female" value="female" size="lg"></app-ds-radio>
        </app-ds-radio-group>
        <p aria-live="polite" style="margin:0;font-size:13px;color:#4b5563;">
          Selected: {{ selectedControl.value || 'none' }}
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const male = canvas.getByText('Male').closest('label');
    const female = canvas.getByText('Female').closest('label');
    const maleInput = male?.querySelector('input[type="radio"]');
    const femaleInput = female?.querySelector('input[type="radio"]');
    const status = canvas.getByText(/Selected:/);

    if (!male || !female || !maleInput || !femaleInput) {
      throw new Error('Could not find radio inputs for the default group.');
    }

    await expect(status).toHaveTextContent('Selected: none');

    await userEvent.click(female);
    await expect(femaleInput).toBeChecked();
    await expect(maleInput).not.toBeChecked();
    await waitFor(() => {
      expect(status).toHaveTextContent('Selected: female');
    });

    await userEvent.click(male);
    await expect(maleInput).toBeChecked();
    await expect(femaleInput).not.toBeChecked();
    await waitFor(() => {
      expect(status).toHaveTextContent('Selected: male');
    });
  },
};

export const WithMoreOptions: Story = {
  name: 'Multiple options',
  render: () => ({
    props: {
      selectedControl: new FormControl<string | null>(null),
    },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-radio-group [formControl]="selectedControl" style="display:flex;flex-direction:column;gap:12px;">
          <app-ds-radio title="Grade 1" value="g1" size="lg"></app-ds-radio>
          <app-ds-radio title="Grade 2" value="g2" size="lg"></app-ds-radio>
          <app-ds-radio title="Grade 3" value="g3" size="lg"></app-ds-radio>
          <app-ds-radio title="Grade 4" value="g4" size="lg"></app-ds-radio>
          <app-ds-radio title="Grade 5" value="g5" size="lg" [disabled]="true"></app-ds-radio>
        </app-ds-radio-group>
        <p aria-live="polite" style="margin:0;font-size:13px;color:#4b5563;">
          Selected grade: {{ selectedControl.value || 'none' }}
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grade2 = canvas.getByText('Grade 2').closest('label');
    const disabledGrade = canvas.getByText('Grade 5').closest('label');
    const grade2Input = grade2?.querySelector('input[type="radio"]');
    const disabledInput = disabledGrade?.querySelector('input[type="radio"]');
    const status = canvas.getByText(/Selected grade:/);

    if (!grade2 || !disabledGrade || !grade2Input || !disabledInput) {
      throw new Error('Could not find radio inputs for the grade group.');
    }

    await expect(disabledInput).toBeDisabled();
    await userEvent.click(disabledGrade);
    await expect(disabledInput).not.toBeChecked();
    await expect(status).toHaveTextContent('Selected grade: none');

    await userEvent.click(grade2);
    await expect(grade2Input).toBeChecked();
    await expect(disabledInput).not.toBeChecked();
    await waitFor(() => {
      expect(status).toHaveTextContent('Selected grade: g2');
    });
  },
};

export const RequiredValidation: Story = {
  name: 'Required validation',
  render: () => ({
    template: `<story-radio-group-validation />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Choose one option.',
    );

    const noLabel = canvas.getByText('No').closest('label');
    const noInput = noLabel?.querySelector('input[type="radio"]');

    if (!noLabel || !noInput) {
      throw new Error('Could not find No radio input.');
    }

    await userEvent.click(noLabel);

    await waitFor(() => {
      expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    });
    await expect(noInput).toBeChecked();
  },
};

export const Small: Story = {
  name: 'Size: sm',
  render: () => ({
    template: `
      <app-ds-radio-group style="display:flex;flex-direction:column;gap:8px;">
        <app-ds-radio title="Option A" value="a" size="sm"></app-ds-radio>
        <app-ds-radio title="Option B" value="b" size="sm"></app-ds-radio>
        <app-ds-radio title="Option C" value="c" size="sm"></app-ds-radio>
      </app-ds-radio-group>
    `,
  }),
};

export const LTR: Story = {
  name: 'LTR (English)',
  render: () => ({
    template: `
      <app-ds-radio-group style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-radio title="Yes" value="yes" size="lg"></app-ds-radio>
        <app-ds-radio title="No"  value="no"  size="lg"></app-ds-radio>
      </app-ds-radio-group>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};

export const RTL: Story = {
  name: 'RTL (Arabic)',
  render: () => ({
    template: `
      <app-ds-radio-group style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-radio title="ذكر"  value="male"   size="lg"></app-ds-radio>
        <app-ds-radio title="أنثى" value="female" size="lg"></app-ds-radio>
      </app-ds-radio-group>
    `,
  }),
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;padding:16px;">${story}</div>`,
    ),
  ],
};
