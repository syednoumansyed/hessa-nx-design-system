import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { hesIcon } from '@shared/types';
import { isMobile } from '@shared/utils/platform';
import { SchoolStructureControlItem } from '../school-structure-control-item.interface';
import { SchoolStructureControlHelperService } from '../school-structure-control.helper.service';

@Component({
  selector: 'app-school-structure-control-item',
  templateUrl: './school-structure-control-item.component.html',
  styleUrls: ['./school-structure-control-item.component.scss'],
  standalone: true,
  imports: [CommonModule, HesIconComponent],
})
export class SchoolStructureControlItemComponent implements OnInit {
  private readonly schoolStructureControlHelperService = inject(
    SchoolStructureControlHelperService,
  );
  isMobile = isMobile();

  explicitShowChildren = signal<boolean | undefined>(undefined);
  collapseIcon = signal({
    src: 'assets/icons/collapse.svg',
    class: 'text-2xl',
  });

  expandIcon = signal({
    src: 'assets/icons/expand.svg',
    class: 'text-2xl',
  });
  item = input.required<SchoolStructureControlItem>();
  @Input() firstLevel: boolean = false;
  @Input() expand: boolean = false;

  readonly isSelected = computed(() => {
    const item = this.item();
    return this.schoolStructureControlHelperService.hasValue(item);
  });

  isShowChildren = computed<boolean>(() => {
    const item = this.item();
    const explicit = this.explicitShowChildren();
    if (explicit !== undefined) {
      return explicit;
    }
    return item.isExpended ?? false;
  });

  constructor() {}

  ngOnInit() {}
  toggleCollapseChildren(event: MouseEvent) {
    event.stopPropagation();
    this.explicitShowChildren.set(!this.explicitShowChildren());
    const item = this.item();
    if (this.explicitShowChildren()) {
      item.isExpended = true;
    }
  }

  onHandleSelect() {
    if (this.item().hasAccess)
      this.schoolStructureControlHelperService.onToggle(this.item());
  }
}
