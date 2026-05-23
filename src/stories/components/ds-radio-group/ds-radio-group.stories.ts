import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { DsRadioComponent } from '@ds/radio-button/radio/radio.component';
import { DsRadioGroupComponent } from '@ds/radio-button/radio-group/radio-group.component';

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
  decorators: [
    applicationConfig({ providers: [provideIonicAngular()] }),
    moduleMetadata({ imports: [DsRadioComponent, DsRadioGroupComponent] }),
    componentWrapperDecorator((story) => `<div style="padding:16px;">${story}</div>`),
  ],
};

export default meta;
type Story = StoryObj<DsRadioGroupComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <app-ds-radio-group style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-radio title="Male" value="male" size="lg"></app-ds-radio>
        <app-ds-radio title="Female" value="female" size="lg"></app-ds-radio>
      </app-ds-radio-group>
    `,
  }),
};

export const WithMoreOptions: Story = {
  name: 'Multiple options',
  render: () => ({
    template: `
      <app-ds-radio-group style="display:flex;flex-direction:column;gap:12px;">
        <app-ds-radio title="Grade 1" value="g1" size="lg"></app-ds-radio>
        <app-ds-radio title="Grade 2" value="g2" size="lg"></app-ds-radio>
        <app-ds-radio title="Grade 3" value="g3" size="lg"></app-ds-radio>
        <app-ds-radio title="Grade 4" value="g4" size="lg"></app-ds-radio>
        <app-ds-radio title="Grade 5" value="g5" size="lg" [disabled]="true"></app-ds-radio>
      </app-ds-radio-group>
    `,
  }),
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
      (story) => `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;padding:16px;">${story}</div>`,
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
