import { Directive, Input, ElementRef, AfterContentInit } from '@angular/core';
import { AuthService } from './auth.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';

@Directive({
  selector: '[hesAuth]',
  standalone: true,
})
/**
 * Directive that controls the visibility of an element based on the user's roles.
 */
export class HesAuthDirective implements AfterContentInit {
  @Input({ required: true }) roles: string[];

  constructor(
    private rbac: RoleBaseAccessControlService,
    private elementRef: ElementRef,
  ) {}

  /**
   * Lifecycle hook that is called after Angular has fully initialized the content of a directive.
   * It is called only once after the first ngAfterContentChecked.
   */
  ngAfterContentInit() {}

  /**
   * Checks if the user has a matching role.
   * @param userRoles - The roles of the user.
   * @returns True if the user has a matching role, false otherwise.
   */
  private hasMatchingRole(userRoles: string[]): boolean {
    if (this.roles?.length === 0) {
      return true;
    }
    return this.roles?.some((role) => userRoles.includes(role));
  }

  /**
   * Hides the element by setting its display property to 'none'.
   */
  private hideElement() {
    this.elementRef.nativeElement.style.display = 'none';
  }
}
