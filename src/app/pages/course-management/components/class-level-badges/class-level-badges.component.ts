import { Component, input, OnInit } from '@angular/core';

@Component({
  selector: 'app-class-level-badges',
  templateUrl: './class-level-badges.component.html',
  standalone: true,
  imports: [],
})
export class ClassLevelBadgesComponent implements OnInit {
  className = input<string>();
  levelName = input<string>();

  constructor() {}

  ngOnInit() {}
}
