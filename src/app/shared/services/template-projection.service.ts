import { Injectable, TemplateRef } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TemplateProjectionService {
  private templateRefSource = new Subject<TemplateRef<any> | null>();
  readonly templateRef$ = this.templateRefSource.asObservable();

  private pageTitleTemplateRefSource = new Subject<TemplateRef<any> | null>();
  readonly pageTitleTemplateRef$ =
    this.pageTitleTemplateRefSource.asObservable();

  private headerActionsTemplateRefSource =
    new Subject<TemplateRef<any> | null>();
  readonly headerActionsTemplateRef$ =
    this.headerActionsTemplateRefSource.asObservable();

  public renderTemplate(templateRef: TemplateRef<any>): void {
    this.templateRefSource.next(templateRef);
  }

  public clearTemplate(): void {
    this.templateRefSource.next(null);
  }

  public renderPageTitleTemplate(templateRef: TemplateRef<any>): void {
    this.pageTitleTemplateRefSource.next(templateRef);
  }

  public clearPageTitleTemplate(): void {
    this.pageTitleTemplateRefSource.next(null);
  }

  public renderHeaderActionsTemplate(templateRef: TemplateRef<any>): void {
    this.headerActionsTemplateRefSource.next(templateRef);
  }

  public clearHeaderActionsTemplate(): void {
    this.headerActionsTemplateRefSource.next(null);
  }
}
