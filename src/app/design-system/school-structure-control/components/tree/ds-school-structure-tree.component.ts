import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
} from '@angular/core';
import { DsSchoolStructureNodeComponent } from '../node/ds-school-structure-node.component';
import { DsSchoolStructureControlItem } from '../../types/school-structure-control.types';
import { DsSchoolStructureControlHelperService } from '../../services/ds-school-structure-control-helper.service';

@Component({
  selector: 'app-ds-school-structure-tree',
  templateUrl: './ds-school-structure-tree.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsSchoolStructureNodeComponent],
})
export class DsSchoolStructureTreeComponent {
  readonly nodes = input<DsSchoolStructureControlItem[] | null>(null);
  readonly helper = input<DsSchoolStructureControlHelperService | null>(null);
  readonly readOnly = input(false);
  @Output() nodeSelected = new EventEmitter<DsSchoolStructureControlItem>();
  @Output() nodeToggled = new EventEmitter<DsSchoolStructureControlItem>();
}
