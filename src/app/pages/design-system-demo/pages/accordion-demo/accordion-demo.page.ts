import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { faEdit, faTrash, faCopy } from '@fortawesome/pro-regular-svg-icons';
import {
  DsAccordionComponent,
  DsAccordionGroupComponent,
  DsAccordionTag,
  DsAccordionMenuItem,
} from '@ds/accordion';
import { DsButtonComponent } from 'src/app/design-system/button/button.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';

@Component({
  selector: 'app-accordion-demo',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    DsAccordionComponent,
    DsAccordionGroupComponent,
    DsButtonComponent,
    DemoPageWrapperComponent,
  ],
  templateUrl: './accordion-demo.page.html',
})
export class AccordionDemoPage {
  toast = inject(HesToasterService);

  @ViewChild('multiGroup') multiGroup!: DsAccordionGroupComponent;
  @ViewChild('singleGroup') singleGroup!: DsAccordionGroupComponent;

  // Tags
  defaultTags: DsAccordionTag[] = [{ text: '5 Lessons' }];

  multipleTags: DsAccordionTag[] = [
    { text: '3 Units', variant: 'default' },
    { text: 'Active', variant: 'primary' },
  ];

  customTags: DsAccordionTag[] = [
    {
      text: 'Draft',
      variant: 'custom',
      customClasses: 'bg-amber-100 text-amber-700',
    },
    { text: '2 Items' },
  ];

  // Menu items
  basicMenuItems: DsAccordionMenuItem[] = [
    {
      id: 'edit',
      title: 'Edit',
      icon: faEdit,
      action: () => this.toast.info('Edit clicked', 'Accordion Menu'),
    },
    {
      id: 'duplicate',
      title: 'Duplicate',
      icon: faCopy,
      action: () => this.toast.info('Duplicate clicked', 'Accordion Menu'),
    },
    {
      id: 'delete',
      title: 'Delete',
      icon: faTrash,
      state: 'danger',
      action: () => this.toast.error('Delete clicked', 'Accordion Menu'),
    },
  ];

  onExpandedChange(title: string, expanded: boolean) {
    this.toast.info(
      `${title}: ${expanded ? 'Expanded' : 'Collapsed'}`,
      'Accordion',
    );
  }

  expandAll() {
    this.multiGroup?.expandAll();
  }

  collapseAll() {
    this.multiGroup?.collapseAll();
    this.singleGroup?.collapseAll();
  }
}
