import { Injectable } from '@angular/core';

type Role = 'student' | 'personnel';

@Injectable({
  providedIn: 'root',
})
export class ThemeManagerService {
  private readonly body = document.body;
  private readonly roleAttribute = 'data-role';

  /** Set role to 'student' (also used for guardian theme) */
  setStudent(): void {
    this.setRole('student');
  }

  /** Set role to 'personnel' */
  setPersonnel(): void {
    this.setRole('personnel');
  }

  /** Clear role from body */
  clearRole(): void {
    this.body.removeAttribute(this.roleAttribute);
  }

  /** Get current role */
  getRole(): Role | null {
    const value = this.body.getAttribute(this.roleAttribute);
    return value === 'student' || value === 'personnel' ? value : null;
  }

  /** Private method to set data-role attribute */
  private setRole(role: Role): void {
    this.body.setAttribute(this.roleAttribute, role);
  }
}
