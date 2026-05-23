import {
  Directive,
  input,
  OnInit,
  OnDestroy,
  ViewContainerRef,
  ComponentRef,
  inject,
  effect,
} from '@angular/core';
import { ReactionsComponent } from '../react.component';
import { ReactionData, ReactionType } from '../types/react.types';

@Directive({
  selector: '[Reactions]',
  standalone: true,
})
export class ReactionsDirective implements OnInit, OnDestroy {
  reactions = input<ReactionData[]>([], { alias: 'Reactions' });
  onReactionToggle =
    input<(event: { type: ReactionType; isAdding: boolean }) => void>();

  private viewContainerRef = inject(ViewContainerRef);
  private componentRef: ComponentRef<ReactionsComponent> | null = null;

  constructor() {
    effect(() => {
      if (this.componentRef) {
        this.componentRef.setInput('reactions', this.reactions());
      }
    });
  }

  ngOnInit() {
    this.createReactionsComponent();
  }

  private createReactionsComponent() {
    this.componentRef =
      this.viewContainerRef.createComponent(ReactionsComponent);

    this.componentRef.setInput('reactions', this.reactions());

    this.componentRef.instance.reactionToggled.subscribe((event) => {
      const toggleHandler = this.onReactionToggle();
      if (toggleHandler) {
        toggleHandler(event);
      }
    });
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }
}
