import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { DsFilterPanelComponent } from '@ds/filter-panel/ds-filter-panel.component';
import {
  DsFilterConfig,
  DsFiltersValue,
} from '@ds/filter-panel/ds-filter-panel.model';
import { StructureDepth } from '@shared/utils/school-structure';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';

@Component({
  selector: 'app-filter-panel-demo',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    DsFilterPanelComponent,
    DemoPageWrapperComponent,
  ],
  templateUrl: './filter-panel-demo.page.html',
})
export class FilterPanelDemoPage {
  filterPanelSelection = signal<DsFiltersValue>({});

  filterPanelFilters: DsFilterConfig[] = [
    {
      type: 'search',
      key: 'searchText',
      label: '',
      placeholder: 'Search by keyword',
      exposed: true,
    },
    {
      type: 'chip-selector',
      key: 'audience',
      label: 'Audience',
      multiple: false,
      options: [
        { value: 'students', displayedValue: 'Students' },
        { value: 'guardians', displayedValue: 'Guardians' },
        { value: 'staff', displayedValue: 'Staff' },
      ],
    },
    {
      type: 'chip-selector',
      key: 'tags',
      label: 'Tags',
      multiple: true,
      options: [
        { value: 'urgent', displayedValue: 'Urgent' },
        { value: 'new', displayedValue: 'New' },
        { value: 'follow-up', displayedValue: 'Follow-up' },
        { value: 'blocked', displayedValue: 'Blocked' },
      ],
    },
    {
      type: 'select',
      key: 'priority',
      label: 'Priority',
      config: {
        placeholder: 'Select priority',
        options: [
          { id: 'low', display: 'Low' },
          { id: 'medium', display: 'Medium' },
          { id: 'high', display: 'High' },
        ],
      },
    },
    {
      type: 'date',
      key: 'updatedAt',
      label: 'Updated Date',
      placeholder: 'Select date',
    },
    {
      type: 'select',
      key: 'owner',
      label: 'Owner',
      config: {
        placeholder: 'Select owner',
        options: [
          { id: 'sara', display: 'Sara Ahmed' },
          { id: 'mohamed', display: 'Mohamed Ali' },
          { id: 'huda', display: 'Huda Youssef' },
        ],
      },
    },
    {
      type: 'select',
      key: 'reference',
      label: 'Reference ID',
      config: {
        placeholder: 'Select reference',
        options: [
          { id: 'ref-1001', display: 'REF-1001' },
          { id: 'ref-2002', display: 'REF-2002' },
          { id: 'ref-3003', display: 'REF-3003' },
        ],
      },
    },
    {
      type: 'school-structure',
      key: 'schoolScope',
      label: 'School Structure',
      placeholder: 'Select scope',
      isMultiSelect: true,
      depth: StructureDepth.SCHOOL,
      allowedSelections: null,
    },
    {
      type: 'select',
      key: 'type',
      label: 'Type',
      config: {
        placeholder: 'Select type',
        isMultiple: true,
        options: [
          { id: 'internal', display: 'Internal' },
          { id: 'external', display: 'External' },
          { id: 'partner', display: 'Partner' },
        ],
      },
    },
    {
      type: 'select',
      key: 'category',
      label: 'Category',
      config: {
        placeholder: 'Select category',
        options: [
          { id: 'academic', display: 'Academic' },
          { id: 'finance', display: 'Finance' },
          { id: 'hr', display: 'HR' },
        ],
      },
    },
  ];

  onFilterPanelChange(filters: DsFiltersValue) {
    this.filterPanelSelection.set(filters);
  }
}
