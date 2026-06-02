import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsAttachmentFormControlComponent } from '@ds/attachment/ds-attachment-form-control.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsInputComponent } from '@ds/input/input.component';
import { DsTextareaComponent } from '@ds/text-area/text-area.component';

@Component({
  selector: 'story-agent-student-assignment-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DsAttachmentFormControlComponent,
    DsButtonComponent,
    DsInputComponent,
    DsTextareaComponent,
  ],
  template: `
    <section
      data-role="student"
      class="mx-auto flex w-full max-w-[720px] flex-col gap-ds-xl bg-surface-primary p-ds-xl text-content-high"
      aria-labelledby="assignment-form-title"
    >
      <header class="flex flex-col gap-ds-sm">
        <p class="content-sm-default text-content-mid">Assignment workspace</p>
        <h2
          id="assignment-form-title"
          class="heading-h3-mid-emphasis text-content-high"
        >
          Submit your assignment
        </h2>
      </header>

      <form [formGroup]="form" class="flex flex-col gap-ds-lg">
        <app-ds-input
          label="Assignment title"
          placeholder="Enter a short title"
          formControlName="title"
          [required]="true"
          [maxLength]="80"
        />

        <app-ds-textarea
          label="Notes"
          placeholder="Tell your teacher what you completed"
          formControlName="notes"
          [required]="true"
          [maxLength]="500"
          [showCharacterCount]="true"
        />

        <ds-attachment-form-control
          label="Upload assignment"
          subLabel="Attach your completed work"
          hint="PDF, DOC, DOCX, or image files"
          formControlName="attachments"
          [isMultiple]="true"
          [maxSizeInMB]="25"
        />

        <div class="flex flex-col gap-ds-md sm:flex-row sm:justify-end">
          <ds-button variant="secondary" size="lg">
            Save draft
          </ds-button>
          <ds-button
            variant="primary"
            size="lg"
            type="submit"
            [loading]="isSubmitting"
            [disabled]="form.invalid || isSubmitting"
          >
            Submit assignment
          </ds-button>
        </div>
      </form>
    </section>
  `,
})
class AgentStudentAssignmentFormStoryComponent {
  isSubmitting = false;

  form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    notes: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    attachments: new FormControl([], { nonNullable: true }),
  });
}

const meta: Meta<AgentStudentAssignmentFormStoryComponent> = {
  title: '4. Agent Workflow/Generated Student Assignment Form',
  component: AgentStudentAssignmentFormStoryComponent,
  tags: [
    'agent',
    'agent-generated',
    'contract:ui-creation',
    'tokens:typography',
    'tokens:semantic-colors',
    'role:student',
    'dev',
    'test',
  ],
  decorators: [
    withHessaProviders({
      translations: {
        'global.click_to_upload.btn': 'Click to upload',
        'global.drag_drop.txt': 'or drag and drop',
        'global.multiple_attachment_upload.info':
          'Drag and drop or click here to upload files ({{types}} up to {{size}}GB)',
        'global.single_attachment_upload.info':
          'Drag and drop or click here to upload a file ({{types}} up to {{size}}GB)',
        'global.attachment.max_size.error.msg':
          'File {{name}} exceeds the maximum allowed size.',
        'global.attachment.not_supported.error.msg':
          'File {{name}} has an unsupported format.',
      },
      toaster: 'mock',
      fileInteractions: 'mock',
    }),
    moduleMetadata({
      imports: [AgentStudentAssignmentFormStoryComponent],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Proof that story context plus token context can produce a new Hessa UI rendered through real Storybook global styles and fonts.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<AgentStudentAssignmentFormStoryComponent>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Submit your assignment' }),
    ).toBeInTheDocument();
    await expect(canvas.getByLabelText(/Assignment title/i)).toBeInTheDocument();
    await expect(canvas.getByText('Upload assignment')).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: 'Submit assignment' }),
    ).toBeDisabled();
  },
};
