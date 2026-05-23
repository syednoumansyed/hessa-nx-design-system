import {
  Directive,
  Input,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { RoleBaseAccessControlService } from './role-base-access-control.service';

@Directive({
  selector: '[hesRbac]',
  standalone: true,
})
export class RbacDirective {
  private readonly templateRef = inject(TemplateRef);
  private readonly vc = inject(ViewContainerRef);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  @Input() hesRbac: number | undefined; // Permission ID to check
  @Input() hesRbacBypassSuperAdminCheck = false; // Optional input to bypass super admin check

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hesRbac'] || changes['hesRbacBypassSuperAdminCheck']) {
      this.checkPermission();
    }
  }

  private updateView(shouldDisplay: boolean): void {
    if (shouldDisplay) {
      this.vc.createEmbeddedView(this.templateRef);
    } else {
      this.vc.clear();
    }
  }

  private checkPermission(): void {
    const shouldDisplay =
      this.hesRbac === undefined ||
      this.rbacService.hasPermission(
        this.hesRbac,
        this.hesRbacBypassSuperAdminCheck,
      );
    this.updateView(shouldDisplay);
  }
}

@Directive({
  selector: '[hesRbacSome]',
  standalone: true,
})
export class RbacSomeDirective {
  private readonly templateRef = inject(TemplateRef);
  private readonly vc = inject(ViewContainerRef);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  @Input() hesRbacSome: number[] | undefined; // Permission ID to check
  @Input() hesRbacBypassSuperAdminCheck = false; // Optional input to bypass super admin check

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hesRbacSome'] || changes['hesRbacBypassSuperAdminCheck']) {
      this.checkPermission();
    }
  }

  private updateView(shouldDisplay: boolean): void {
    if (shouldDisplay) {
      this.vc.createEmbeddedView(this.templateRef);
    } else {
      this.vc.clear();
    }
  }

  private checkPermission(): void {
    const permissionId = this.hesRbacSome;
    if (!permissionId?.length) {
      this.updateView(true);
      return;
    }
    const shouldDisplay =
      permissionId === undefined ||
      this.rbacService.hasSomePermission(
        permissionId,
        this.hesRbacBypassSuperAdminCheck,
      );
    this.updateView(shouldDisplay);
  }
}
