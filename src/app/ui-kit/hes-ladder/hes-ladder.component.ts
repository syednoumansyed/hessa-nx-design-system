import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
@Component({
  selector: 'app-hes-ladder',
  templateUrl: './hes-ladder.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class HesLadderComponent {
  // #region Input and Configuration
  config = input.required<HesLadderConfig>();
  // #endregion Input and Configuration

  // #region Computed Properties
  activeLevel = computed<number>(() => {
    return this.config().activeLevel;
  });

  title = computed<string>(() => {
    return this.config().title;
  });

  steps = computed<HesLadderSteps[]>(() => {
    return this.config().steps;
  });
  // #endregion Computed Properties
}

// #region Interfaces
export interface HesLadderConfig {
  title: string;
  activeLevel: number;
  steps: HesLadderSteps[];
}

interface HesLadderSteps {
  levelNumber: number;
  title: string;
  stepDetail?: string;
}
// #endregion Interfaces
