import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectableOptionGroupComponent } from '../../design-system/selectable-option/selectable-option-group.component';
import { SelectableOptionGroupConfig } from '@ds/selectable-option/selectable-option.types';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-selectable-demo',
  standalone: true,
  imports: [CommonModule, SelectableOptionGroupComponent, ReactiveFormsModule],
  template: `
    <div class="space-y-4 rounded-lg border bg-white p-4">
      <div
        class="mb-4 flex flex-wrap items-center justify-between gap-4 border-b-2 py-4 md:justify-start"
      >
        <span class="ml-6 font-medium"
          >Correct Option:
          <span class="text-green-600">{{ correctOptionValue() }}</span></span
        >

        <label class="ml-6 flex items-center gap-2">
          <input
            type="checkbox"
            [checked]="selectedMode() === 'view' ? revealAnswer() : false"
            [disabled]="selectedMode() !== 'view'"
            (change)="onRevealAnswerChange($event)"
          />
          Reveal Answer
        </label>

        <label for="mode-select" class="ml-6 font-medium">Mode:</label>
        <select
          id="mode-select"
          class="rounded border px-2 py-1"
          [value]="selectedMode()"
          (change)="onModeChange($event)"
        >
          <option *ngFor="let mode of modes" [value]="mode.value">
            {{ mode.label }}
          </option>
        </select>
        <div>select Options {{ control.value }}</div>
      </div>
      <app-ds-selectable-option-group
        [config]="groupConfig()"
        [formControl]="control"
      ></app-ds-selectable-option-group>
    </div>
  `,
})
export class SelectableDemoComponent {
  selectedMode = signal<SelectableOptionGroupConfig['mode']>('attempt');
  control = new FormControl<string | null>(null);

  correctOptionValue =
    signal<SelectableOptionGroupConfig['correctOptionValue']>('A');
  revealAnswer = signal<boolean>(false);

  modes = [
    { value: 'attempt', label: 'Attempt' },
    { value: 'view', label: 'View' },
  ];

  onSelectedOptionChange(event: Event) {
    this.control.setValue((event.target as HTMLSelectElement).value || null);
  }
  onCorrectOptionChange(event: Event) {
    this.correctOptionValue.set((event.target as HTMLSelectElement).value);
  }
  onRevealAnswerChange(event: Event) {
    this.revealAnswer.set((event.target as HTMLInputElement).checked);
  }
  onModeChange(event: Event) {
    const mode = (event.target as HTMLSelectElement)
      .value as SelectableOptionGroupConfig['mode'];
    this.selectedMode.set(mode);
    if (mode !== 'view') {
      this.revealAnswer.set(false);
    }
  }

  groupConfig = computed<SelectableOptionGroupConfig>(() => {
    return {
      mode: this.selectedMode(),
      correctOptionValue: this.correctOptionValue(),
      revealAnswer: this.revealAnswer(),
      options: [
        {
          value: 'A',
          display:
            'here is simple text to see how it going to work is it going to second line or not if not we need to adjust it and also check the space between icon and text it self',
        },
        { value: 'B', display: 'Option B' },
        { value: 'C', display: 'Option C' },
        { value: 'D', display: 'Option D' },
      ],
    };
  });
}
