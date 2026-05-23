import { Component, ContentChildren, QueryList } from '@angular/core';
import { HesTabComponent } from '../hes-tab/hes-tab.component';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-hes-tab-group',
  templateUrl: './hes-tab-group.component.html',
  standalone: true,
  imports: [NgClass],
})
export class HesTabGroupComponent {
  @ContentChildren(HesTabComponent) tabs!: QueryList<HesTabComponent>;

  ngAfterContentInit() {
    const activeTabs = this.tabs.filter((tab) => tab.active);

    if (activeTabs.length === 0) {
      this.selectTab(this.tabs.first);
    }
  }

  selectTab(tab: HesTabComponent) {
    this.tabs.toArray().forEach((t) => (t.active = false));
    tab.active = true;
  }
}
