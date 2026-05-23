import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  input,
  TemplateRef,
  viewChild,
  ViewContainerRef,
  AfterViewInit,
  ChangeDetectionStrategy,
  Type,
  ComponentRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { TooltipDirection } from './ds-tooltip.directive';

@Component({
  selector: 'ds-tooltip-panel',
  standalone: true,
  template: `
    <div
      class="ds-tooltip-panel max-w-xs rounded-ds-sm bg-neutral-cool-900 p-ds-md sm:max-w-md"
      [ngClass]="position()"
    >
      @if (contentTemplate()) {
        <ng-container [ngTemplateOutlet]="contentTemplate()!"></ng-container>
      } @else {
        @if (componentType()) {
          <ng-template #componentHost></ng-template>
        } @else {
          <ng-content></ng-content>
        }
      }
    </div>
  `,
  styleUrls: ['./ds-tooltip-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, NgTemplateOutlet],
})
export class DsTooltipPanelComponent implements AfterViewInit, OnChanges {
  position = input<TooltipDirection>('above');
  contentTemplate = input<TemplateRef<any> | undefined>();
  componentType = input<Type<any> | undefined>();
  componentInputs = input<Record<string, any> | undefined>();
  componentHostRef = viewChild('componentHost', { read: ViewContainerRef });
  private componentRef?: ComponentRef<any>;

  ngAfterViewInit() {
    this.renderComponent();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['componentType'] || changes['componentInputs']) {
      this.renderComponent();
    }
  }

  private renderComponent() {
    const host = this.componentHostRef();
    const type = this.componentType();
    const inputs = this.componentInputs();
    if (type && host) {
      host.clear();
      this.componentRef = host.createComponent(type);
      if (inputs && this.componentRef) {
        Object.assign(this.componentRef.instance, inputs);
      }
    }
  }
}
