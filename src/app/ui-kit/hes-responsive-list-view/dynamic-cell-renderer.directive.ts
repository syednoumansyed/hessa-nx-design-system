import {
  Directive,
  Input,
  ViewContainerRef,
  OnInit,
  Type,
  Renderer2,
  ElementRef,
  SecurityContext,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Directive({
  selector: '[dynamicCellRenderer]',
  standalone: true,
})
export class DynamicCellRendererDirective implements OnInit {
  @Input() dynamicCellRenderer!: {
    component: FuntionalType | Type<any>;
    params: {
      data: any;
      col: any;
      value: any;
    };
  };

  constructor(
    private viewContainerRef: ViewContainerRef,
    private renderer: Renderer2,
    private el: ElementRef,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    const { component, params } = this.dynamicCellRenderer;
    if (component) {
      try {
        const componentRef = this.viewContainerRef.createComponent(
          component as Type<any>,
        );
        Object.assign(componentRef.instance, params);

        if (typeof componentRef.instance.agInit === 'function') {
          componentRef.instance.agInit(params);
        }
      } catch (e) {
        const rawHtml = (component as FuntionalType)(params);
        const safeHtml = this.sanitizer.sanitize(
          SecurityContext.HTML,
          this.sanitizer.bypassSecurityTrustHtml(rawHtml),
        );

        if (safeHtml) {
          this.renderer.setProperty(
            this.el.nativeElement,
            'innerHTML',
            safeHtml,
          );
        }
      }
    }
  }
}

type FuntionalType = (data: any) => string;
