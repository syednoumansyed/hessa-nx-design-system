import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-hes-tab',
  templateUrl: './hes-tab.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class HesTabComponent implements OnInit {
  @Input() tabTitle!: string;
  @Input() active = false;
  constructor() {}

  ngOnInit() {}
}
