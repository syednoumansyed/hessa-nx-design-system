import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';
import { AvatarComponent } from '@ds/avatar/avatar.component';

export interface StudentOption {
  id: number;
  displayName: string;
  avatarUrl?: string | null;
  schoolName?: string | null;
}

@Component({
  selector: 'app-student-select-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DsCheckboxComponent, AvatarComponent],
  templateUrl: './student-select-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentSelectListComponent {
  @Input() students: StudentOption[] = [];
  @Input() label: string = '';
  @Input() required: boolean = false;
  private _selectedIds: number[] = [];
  @Input() set selectedIds(val: number[] | null | undefined) {
    this._selectedIds = val ?? [];
    this.selected.set(new Set<number>(this._selectedIds));
  }
  get selectedIds(): number[] {
    return this._selectedIds;
  }

  @Output() selectedIdsChange = new EventEmitter<number[]>();

  private selected = signal<Set<number>>(new Set<number>());

  isSelected = computed(() => (id: number) => this.selected().has(id));

  toggle(id: number): void {
    const next = new Set(this.selected());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selected.set(next);
    this.selectedIdsChange.emit(Array.from(next));
  }
}
