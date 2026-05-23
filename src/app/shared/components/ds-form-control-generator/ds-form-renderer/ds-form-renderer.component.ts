import { Component, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsFormControlGeneratorComponent } from '../ds-form-control-generator.component';
import { DsFormControl } from '../ds-form-control-generator.model';

export type FormControlConfig = DsFormControl & { row?: string };
export type DsGapSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

@Component({
  selector: 'app-ds-form-renderer',
  standalone: true,
  imports: [CommonModule, DsFormControlGeneratorComponent],
  template: `
    @for (group of groupedControls(); track $index) {
      @if (group.columns > 1) {
        <div
          class="grid grid-cols-1"
          [ngClass]="['gap-ds-' + gap, 'md:grid-cols-' + group.columns]"
        >
          @for (control of group.controls; track control.formControlName) {
            <app-ds-form-control-generator [control]="control" />
          }
        </div>
      } @else {
        @for (control of group.controls; track control.formControlName) {
          <app-ds-form-control-generator [control]="control" />
        }
      }
    }
  `,
  host: {
    class: 'flex flex-col',
    '[class]': '"gap-ds-" + gap',
  },
})
export class DsFormRendererComponent {
  @Input({ required: true }) controls: FormControlConfig[] = [];
  @Input() gap: DsGapSize = 'lg';

  protected readonly groupedControls = computed(() => {
    const groups: { controls: DsFormControl[]; columns: number }[] = [];
    let currentRow: string | undefined;
    let currentGroup: DsFormControl[] = [];

    for (const control of this.controls) {
      if (control.row) {
        if (control.row === currentRow) {
          currentGroup.push(control);
        } else {
          if (currentGroup.length > 0) {
            groups.push({
              controls: currentGroup,
              columns: currentGroup.length,
            });
          }
          currentRow = control.row;
          currentGroup = [control];
        }
      } else {
        if (currentGroup.length > 0) {
          groups.push({ controls: currentGroup, columns: currentGroup.length });
          currentGroup = [];
          currentRow = undefined;
        }
        groups.push({ controls: [control], columns: 1 });
      }
    }

    if (currentGroup.length > 0) {
      groups.push({ controls: currentGroup, columns: currentGroup.length });
    }

    return groups;
  });
}
