import { Component, OnInit, input } from '@angular/core';
import { SchoolStructureControlItem } from '../school-structure-control-item.interface';
import { SchoolStructureControlItemComponent } from '../school-structure-control-item/school-structure-control-item.component';

@Component({
  selector: 'app-hes-school-structure-list',
  templateUrl: './hes-school-structure-list.component.html',
  standalone: true,
  imports: [SchoolStructureControlItemComponent],
})
export class HesSchoolStructureListComponent implements OnInit {
  data = input<SchoolStructureControlItem[] | null>();
  constructor() {}

  ngOnInit() {}
}
