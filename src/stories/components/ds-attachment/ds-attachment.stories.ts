import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { DsAttachmentFormControlComponent } from '@ds/attachment/ds-attachment-form-control.component';

const attachmentTranslations = {
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
};

/**
 * # Attachment Form Control — `ds-attachment-form-control`
 *
 * A drag-and-drop file uploader component that implements `ControlValueAccessor` for full Reactive Forms support.
 *
 * **When to use:**
 * - Uploading assignments, homework files, profile attachments, or receipts
 * - Supporting single or multi-file uploads with size/type restrictions
 */
const meta: Meta<DsAttachmentFormControlComponent> = {
  title: '3. P2 Components/Attachment Form Control',
  component: DsAttachmentFormControlComponent,
  tags: ['autodocs'],
  decorators: [
    withHessaProviders({
      translations: attachmentTranslations,
      toaster: 'mock',
      fileInteractions: 'mock',
    }),
    moduleMetadata({ imports: [DsAttachmentFormControlComponent] }),
    componentWrapperDecorator(
      (story) =>
        `<div style="max-width:480px;margin:0 auto;padding:16px;">${story}</div>`,
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    label: { control: 'text' },
    subLabel: { control: 'text' },
    placeholder: { control: 'text' },
    hint: { control: 'text' },
    maxSizeInMB: { control: 'number' },
    isMultiple: { control: 'boolean' },
    isreadonly: { control: 'boolean' },
    isReplacePrevious: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<DsAttachmentFormControlComponent>;

export const Default: Story = {
  args: {
    label: 'Upload Assignment',
    subLabel: 'Please upload your homework',
    maxSizeInMB: 10,
    isMultiple: false,
    acceptFileTypes: ['PDF', 'WORD'],
  },
};

export const MultipleFiles: Story = {
  name: 'Multiple File Upload',
  args: {
    label: 'Course Assets',
    subLabel: 'Attach supporting course materials',
    isMultiple: true,
    maxSizeInMB: 25,
    acceptFileTypes: ['COMMON_IMAGES', 'PDF'],
  },
};

export const Readonly: Story = {
  name: 'State: Readonly',
  args: {
    label: 'Syllabus PDF',
    isreadonly: true,
    acceptFileTypes: ['PDF'],
  },
};

export const Error: Story = {
  name: 'State: Rejected file',
  args: {
    label: 'Upload Assignment',
    placeholder: 'PDF files up to 100 bytes',
    maxSizeInMB: 0.0001,
    isMultiple: false,
    acceptFileTypes: ['PDF'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fileInput = canvasElement.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    await expect(fileInput).not.toBeNull();
    await userEvent.upload(
      fileInput!,
      new File([new Uint8Array(2048)], 'oversized.pdf', {
        type: 'application/pdf',
      }),
    );
    await expect(canvas.queryByText('oversized.pdf')).not.toBeInTheDocument();
    await expect(canvas.getByText('PDF files up to 100 bytes')).toBeVisible();
  },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    label: 'Document Upload',
    hint: 'PDF and DOCX only',
    acceptFileTypes: ['PDF', 'WORD'],
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;">${story}</div>`,
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    label: 'تحميل المستندات',
    hint: 'الملفات المتاحة: PDF و DOCX فقط',
    acceptFileTypes: ['PDF', 'WORD'],
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;">${story}</div>`,
    ),
  ],
};
