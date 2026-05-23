import {
  Component,
  ContentChildren,
  QueryList,
  AfterContentInit,
  input,
  OnDestroy,
  OutputRefSubscription,
} from '@angular/core';
import { DsAccordionComponent } from './accordion.component';

@Component({
  selector: 'ds-accordion-group',
  standalone: true,
  template: `<ng-content></ng-content>`,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--ds-spacing-md, 0.75rem);
      }
    `,
  ],
})
export class DsAccordionGroupComponent implements AfterContentInit, OnDestroy {
  @ContentChildren(DsAccordionComponent)
  accordions!: QueryList<DsAccordionComponent>;

  readonly allowMultiple = input<boolean>(false);

  private subscriptions: OutputRefSubscription[] = [];

  ngAfterContentInit() {
    this.setupAccordionListeners();

    this.accordions.changes.subscribe(() => {
      this.cleanupSubscriptions();
      this.setupAccordionListeners();
    });
  }

  ngOnDestroy() {
    this.cleanupSubscriptions();
  }

  private setupAccordionListeners() {
    this.accordions.forEach((accordion) => {
      const sub = accordion.expandedChange.subscribe((expanded) => {
        if (expanded && !this.allowMultiple()) {
          this.collapseOthers(accordion);
        }
      });
      this.subscriptions.push(sub);
    });
  }

  private collapseOthers(expandedAccordion: DsAccordionComponent) {
    this.accordions.forEach((accordion) => {
      if (accordion !== expandedAccordion && accordion.isExpanded()) {
        accordion.collapse();
      }
    });
  }

  private cleanupSubscriptions() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }

  expandAll() {
    if (this.allowMultiple()) {
      this.accordions.forEach((accordion) => accordion.expand());
    }
  }

  collapseAll() {
    this.accordions.forEach((accordion) => accordion.collapse());
  }
}
