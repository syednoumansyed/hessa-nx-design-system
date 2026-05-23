import { Component, input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  RbacDirective,
  RbacSomeDirective,
} from '@shared/role-bace-acces-controller/rbac.directive';
import { FaIconComponentsProps } from '@shared/types';
import { NgIconComponent } from '@ng-icons/core';
import { HesIconComponent } from '../hes-icon/hes-icon.component';

export interface IPageItem {
  faIcon?: FaIconComponentsProps;
  iconName?: string;
  svg?: string;
  iconClass?: string;
  titleI18nKey: string;
  path: string;
  permission?: number;
  permissions?: number[];
}

@Component({
  selector: 'app-pages-list',
  templateUrl: './pages-list.component.html',
  standalone: true,
  imports: [
    RouterModule,
    TranslocoDirective,
    RbacDirective,
    RbacSomeDirective,
    NgIconComponent,
    HesIconComponent,
  ],
})
export class PagesListComponent implements OnInit {
  list = input<Array<IPageItem>>();

  translocoScope = input<string>();

  constructor() {}

  ngOnInit() {}
}
