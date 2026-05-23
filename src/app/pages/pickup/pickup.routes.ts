import { Routes } from '@angular/router';
import {
  rbacGuard,
  rbacSomeGuard,
} from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { guardianOnlyGuard } from './guards/guardian-only.guard';
import { locationGateGuard } from './pickup.guard';

export const PickupRoutes: Routes = [
  {
    path: '',
    resolve: {},
    children: [
      {
        path: '',
        resolve: {},
        data: { breadcrumb: 'global.pickup_requests.title' },
        canActivate: [
          locationGateGuard,
          rbacGuard(RESOURCE_PERMISSION.DISMISSAL.CREATE.CREATE_DISMISSAL),
        ],
        loadComponent: () =>
          import('./pages/pickup-guardian/pickup-guardian.page').then(
            (m) => m.PickupGuardianPage,
          ),
      },
      {
        path: 'guardian-history',
        resolve: {},
        data: { breadcrumb: 'dismissal.pickup_history.title' },
        canActivate: [
          rbacGuard(
            RESOURCE_PERMISSION.DISMISSAL.READ.VIEW_DISMISSAL_LIST_GUARDIAN,
          ),
        ],
        loadComponent: () =>
          import('./pages/pickup-history/pickup-history.page').then(
            (m) => m.PickupHistoryPage,
          ),
      },
      {
        path: 'guardian-map',
        resolve: {},
        canActivate: [
          locationGateGuard,
          rbacGuard(RESOURCE_PERMISSION.DISMISSAL.CREATE.CREATE_DISMISSAL),
        ],
        loadComponent: () =>
          import('./pages/pickup-guardian-map/pickup-guardian-map.page').then(
            (m) => m.PickupGuardianMapPage,
          ),
      },
      {
        path: 'personnel-request',
        resolve: {},
        data: { breadcrumb: 'global.pickup_requests.title', fullWidth: true },
        canActivate: [
          rbacSomeGuard([
            RESOURCE_PERMISSION.DISMISSAL.UPDATE.APPROVE_DENY_PICKUP_REQUEST,
            RESOURCE_PERMISSION.DISMISSAL.UPDATE.PROCESS_PICKUP_REQUEST,
          ]),
        ],
        loadComponent: () =>
          import('./pages/pickup-personnel-v2/pickup-personnel.page').then(
            (m) => m.PickupPersonnelV2Page,
          ),
      },
      {
        path: 'personnel-history',
        resolve: {},
        data: {
          breadcrumb: 'dismissal.pickup_history.title',
          noMobilePadding: true,
          fullWidth: true,
        },
        canActivate: [
          rbacGuard(
            RESOURCE_PERMISSION.DISMISSAL.READ.VIEW_DISMISSAL_LIST_PERSONNEL,
          ),
        ],
        loadComponent: () =>
          import('./pages/pickup-personnel-v2/pickup-personnel.page').then(
            (m) => m.PickupPersonnelV2Page,
          ),
      },
      {
        path: 'camera-permission-error',
        resolve: {},
        data: {
          breadcrumb: 'dismissal.pickup.btn',
          noMobilePadding: true,
          hideHeaderMobile: false,
        },
        canActivate: [
          rbacGuard(
            RESOURCE_PERMISSION.DISMISSAL.UPDATE.PROCESS_PICKUP_REQUEST,
          ),
        ],
        loadComponent: () =>
          import('./pages/scan-qr/scan-qr.page').then(
            (m) => m.CameraPermissionErrorPage,
          ),
      },
      {
        path: 'delegate-pickup',
        resolve: {},
        data: { breadcrumb: 'dismissal.delegate_pickup.txt' },
        canActivate: [guardianOnlyGuard()],
        loadComponent: () =>
          import('./pages/delegate-pickup/delegate-pickup.page').then(
            (m) => m.DelegatePickupPage,
          ),
      },
      {
        path: 'delegate-pickup/add',
        resolve: {},
        data: { breadcrumb: 'global.add_delegate.txt' },
        canActivate: [guardianOnlyGuard()],
        loadComponent: () =>
          import('./pages/add-delegate/add-delegate.page').then(
            (m) => m.AddDelegatePage,
          ),
      },
      {
        path: 'delegate-pickup/edit/:id',
        resolve: {},
        data: { breadcrumb: 'dismissal.edit_delegate.txt' },
        canActivate: [guardianOnlyGuard()],
        loadComponent: () =>
          import('./pages/add-delegate/add-delegate.page').then(
            (m) => m.AddDelegatePage,
          ),
      },
    ],
  },
];
