import { Routes } from '@angular/router';

export const DesignSystemDemoRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./design-system-demo-hub.page').then(
            (m) => m.DesignSystemDemoHubPage,
          ),
      },
      {
        path: 'buttons',
        loadComponent: () =>
          import('./pages/button-demo/button-demo.page').then(
            (m) => m.ButtonDemoPage,
          ),
      },
      {
        path: 'inputs',
        loadComponent: () =>
          import('./pages/input-demo/input-demo.page').then(
            (m) => m.InputDemoPage,
          ),
      },
      {
        path: 'selections',
        loadComponent: () =>
          import('./pages/selection-demo/selection-demo.page').then(
            (m) => m.SelectionDemoPage,
          ),
      },
      {
        path: 'data-entry',
        loadComponent: () =>
          import('./pages/data-entry-demo/data-entry-demo.page').then(
            (m) => m.DataEntryDemoPage,
          ),
      },
      {
        path: 'feedback',
        loadComponent: () =>
          import('./pages/feedback-demo/feedback-demo.page').then(
            (m) => m.FeedbackDemoPage,
          ),
      },
      {
        path: 'navigation',
        loadComponent: () =>
          import('./pages/navigation-demo/navigation-demo.page').then(
            (m) => m.NavigationDemoPage,
          ),
      },
      {
        path: 'data-display',
        loadComponent: () =>
          import('./pages/data-display-demo/data-display-demo.page').then(
            (m) => m.DataDisplayDemoPage,
          ),
      },
      {
        path: 'school-structure',
        loadComponent: () =>
          import('./pages/school-structure-demo/school-structure-demo.page').then(
            (m) => m.SchoolStructureDemoPage,
          ),
      },
      {
        path: 'filter-panel',
        loadComponent: () =>
          import('./pages/filter-panel-demo/filter-panel-demo.page').then(
            (m) => m.FilterPanelDemoPage,
          ),
      },
      {
        path: 'forms',
        loadComponent: () =>
          import('./pages/form-renderer-demo/form-renderer-demo.page').then(
            (m) => m.FormRendererDemoPage,
          ),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./pages/calendar-demo-page/calendar-demo.page').then(
            (m) => m.CalendarDemoPage,
          ),
      },
      {
        path: 'accordion',
        loadComponent: () =>
          import('./pages/accordion-demo/accordion-demo.page').then(
            (m) => m.AccordionDemoPage,
          ),
      },
      {
        path: 'typography',
        loadComponent: () =>
          import('./pages/typography-demo/typography-demo.page').then(
            (m) => m.TypographyDemoPage,
          ),
      },
    ],
  },
];
