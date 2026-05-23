import { CommonModule, NgClass } from '@angular/common';
import { Component, computed, effect, input, signal } from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { SupportJourneyStudent } from '@pages/support-hub/data-access/journey/support-journey-student.model';
import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';

@Component({
  selector: 'app-support-journey-student-selection-modal',
  standalone: true,
  imports: [CommonModule, NgClass, DsIconComponent, AvatarComponent],
  templateUrl: './support-journey-student-selection-modal.component.html',
})
export class SupportJourneyStudentSelectionModalComponent implements DsModalContentComponent {
  readonly students = input<SupportJourneyStudent[]>([]);
  readonly initialSelectedIds = input<readonly string[]>([]);
  readonly readonly = input<boolean>(false);
  closeModal?: (data?: unknown, role?: string) => void;

  protected readonly checkIcon = faCheck;
  private readonly selectedIds = signal<Set<string>>(new Set());

  protected readonly hasSelection = computed(() => this.selectedIds().size > 0);
  readonly primaryButtonDisabled = signal(true);

  constructor() {
    effect(() => {
      const readonly = this.readonly();
      if (readonly) {
        const allIds = this.students().map((student) => student.id);
        this.selectedIds.set(new Set(allIds));
        return;
      }
      const ids = this.initialSelectedIds() ?? [];
      this.selectedIds.set(new Set(ids));
    });
    effect(() => {
      this.primaryButtonDisabled.set(!this.hasSelection());
    });
  }

  protected isSelected(student: SupportJourneyStudent): boolean {
    return this.selectedIds().has(student.id);
  }

  protected toggleStudent(student: SupportJourneyStudent): void {
    if (this.readonly()) {
      return;
    }
    const next = new Set(this.selectedIds());
    if (next.has(student.id)) {
      next.delete(student.id);
    } else {
      next.add(student.id);
    }
    this.selectedIds.set(next);
  }

  onCloseClick(): void {
    if (this.closeModal) {
      this.closeModal(null, 'cancel');
    }
  }

  onPrimaryClick(): void {
    const selectedStudents = this.students().filter((student) =>
      this.selectedIds().has(student.id),
    );
    if (this.closeModal) {
      this.closeModal(selectedStudents, 'confirm');
    }
  }
}
