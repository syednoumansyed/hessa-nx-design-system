import { computed, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ManageReportCardContextService {
  private readonly formState = signal<'create' | 'edit' | 'view'>('create');
  readonly isView = computed(() => this.formState() === 'view');
  readonly isEdit = computed(() => this.formState() === 'edit');
  readonly isCreate = computed(() => this.formState() === 'create');
  private readonly step = signal(0);
  readonly currentStep = computed(() => this.step());
  private readonly isRefatchReportCardDetail = new Subject<void>();
  readonly refatchReportCardDetail$ =
    this.isRefatchReportCardDetail.asObservable();
  constructor() {}

  setViewState() {
    this.formState.set('view');
  }

  setEditState() {
    this.formState.set('edit');
  }

  setCreateState() {
    this.formState.set('create');
  }

  onRefatchReportCardDetail() {
    this.isRefatchReportCardDetail.next();
  }

  setStep(step: number) {
    this.step.set(step);
  }

  addReportCardState() {
    this.setCreateState();
    this.setStep(0);
  }

  viewReportCardState() {
    this.setViewState();
    this.setStep(0);
  }
}
