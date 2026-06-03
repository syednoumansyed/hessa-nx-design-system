import {
  Meta,
  StoryObj,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { expect, within, userEvent } from 'storybook/test';
import { DsQrScannerComponent } from '@ds/qr-scanner/qr-scanner.component';
import { withHessaProviders } from '../../../../.storybook/hessa-providers';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

// Mock Navigator MediaDevices to simulate camera presence in Storybook
const mockMediaDevices = () => {
  if (typeof window === 'undefined') return;

  const mockDevices = [
    {
      deviceId: 'mock-camera-id',
      groupId: 'mock-group-id',
      kind: 'videoinput' as MediaDeviceKind,
      label: 'Back Camera 0 (rear)',
      toJSON() {
        return this;
      },
    },
  ];

  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      enumerateDevices: async () => mockDevices,
      getUserMedia: async () => ({
        getVideoTracks: () => [
          {
            stop: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
          },
        ],
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  });
};

/**
 * # QR Scanner — `ds-qr-scanner`
 *
 * Camera-based QR Code scanning component. It auto-detects rear facing cameras and
 * includes a silent camera auto-correction fallback loop on WebView environments.
 */
const meta: Meta<DsQrScannerComponent> = {
  title: '1. P0 Components/QR Scanner',
  component: DsQrScannerComponent,
  tags: ['autodocs'],
  decorators: [
    withHessaProviders({ ionic: true }),
    moduleMetadata({
      imports: [DsQrScannerComponent, ZXingScannerModule],
    }),
    componentWrapperDecorator((story) => {
      mockMediaDevices();
      return `<div class="p-ds-lg max-w-[480px] bg-black text-white rounded-ds-xl overflow-hidden">${story}</div>`;
    }),
  ],
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    showCloseButton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<DsQrScannerComponent>;

// ─── Default ─────────────────────────────────────────────────────────────────
export const Default: Story = {
  name: 'Default',
  args: {
    title: 'Scan Student QR Code',
    subtitle: 'Hold the card in front of the camera frame.',
    showCloseButton: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const titleText = canvas.getByText('Scan Student QR Code');
    await expect(titleText).toBeInTheDocument();
  },
};

// ─── Error ───────────────────────────────────────────────────────────────────
export const Error: Story = {
  name: 'State: Error (Permission Denied)',
  args: {
    title: 'Camera Access Needed',
    subtitle: 'Please enable camera permissions.',
    showCloseButton: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Directly invoke component error state for visual review
    const component = canvasElement.querySelector('ds-qr-scanner');
    if (component) {
      // Simulate permission rejection
      const scanner = (component as any).__ngContext__[8]; // Get component instance
      if (scanner) {
        scanner.onPermissionResponse(false);
      }
    }
    const errorText = await canvas.findByText('Camera permission denied');
    await expect(errorText).toBeInTheDocument();
  },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────
export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    title: 'QR Code Reader',
    subtitle: 'Scan any QR code',
    showCloseButton: true,
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="en" dir="ltr">${story}</div>`,
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────
export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    title: 'مسح رمز الاستجابة السريعة',
    subtitle: 'وجه الكاميرا نحو رمز الاستجابة السريعة.',
    showCloseButton: true,
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div lang="ar" dir="rtl">${story}</div>`,
    ),
  ],
};
