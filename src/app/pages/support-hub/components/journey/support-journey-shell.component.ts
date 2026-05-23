import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  SupportJourneySelectionChangeEvent,
  SupportJourneyStage,
} from '@pages/support-hub/data-access/journey/support-journey-stage.model';
import { SupportJourneyStageHostComponent } from './support-journey-stage-host.component';

@Component({
  selector: 'app-support-journey-shell',
  standalone: true,
  templateUrl: './support-journey-shell.component.html',
  imports: [CommonModule, SupportJourneyStageHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportJourneyShellComponent {
  readonly stages = input<ReadonlyArray<SupportJourneyStage>>([]);

  readonly stageEdit = output<SupportJourneyStage>();
  readonly stageSelectionChange = output<SupportJourneySelectionChangeEvent>();

  protected readonly orderedStages = computed(() => [...this.stages()]);

  protected shouldShowSupportAvatar(index: number): boolean {
    const stages = this.orderedStages();
    const stage = stages[index];

    if (!stage || stage.direction !== 'receiver') {
      return false;
    }

    const nextStage = stages[index + 1];
    return !nextStage || nextStage.direction !== 'receiver';
  }

  protected onStageEdit(stage: SupportJourneyStage): void {
    this.stageEdit.emit(stage);
  }

  protected onStageSelectionChange(event: unknown): void {
    if (!event || typeof event !== 'object') {
      return;
    }

    const candidate = event as Partial<SupportJourneySelectionChangeEvent>;
    if (!candidate.stage || !candidate.option) {
      return;
    }

    this.stageSelectionChange.emit(
      candidate as SupportJourneySelectionChangeEvent,
    );
  }
}
