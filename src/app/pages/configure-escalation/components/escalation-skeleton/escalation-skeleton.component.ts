import { Component, Input, OnInit, signal } from '@angular/core';
import { isMobile } from '@shared/utils/platform';

@Component({
  standalone: true,
  selector: 'app-escalation-skeleton',
  templateUrl: './escalation-skeleton.component.html',
})
export class EscalationSkeletonComponent implements OnInit {
  isMobile = isMobile();
  @Input() itemsCount: number = 3;
  items = signal<number[]>([]);
  ngOnInit() {
    this.items.set(new Array(this.itemsCount));
  }
}
