import {
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { faClose } from '@fortawesome/pro-regular-svg-icons';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { ExistingColumnFormComponent } from './existing-column-form/existing-column-form.component';
import {
  ReportCardColumnDetailDTO,
  ReportCardExistingColumnDTO,
} from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import { ModalController } from '@ionic/angular/standalone';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NewColumnFormComponent } from './new-column-form/new-column-form.component';
import { ReportCardDetail } from '@pages/report-card/configuration/data-access/report-card-configuration.interface';

enum ColumnType {
  newColumn = 'newColumn',
  existingColumn = 'existingColumn',
}
@Component({
  templateUrl: './column-form.component.html',
  standalone: true,
  imports: [
    HesButtonModule,
    CommonModule,
    TranslocoDirective,
    ReactiveFormsModule,
    ExistingColumnFormComponent,
    NewColumnFormComponent,
  ],
})
export class ColumnFormComponent implements OnInit {
  // #region Inputs
  @Input() reportCard!: ReportCardDetail;
  @Input() column: ReportCardColumnDetailDTO | null = null;
  @Input() existingColumn: ReportCardExistingColumnDTO | null = null;
  // #endregion

  // #region Injectables
  private readonly destroyRef$ = inject(DestroyRef);
  private readonly controller = inject(ModalController);
  // #endregion

  // #region Protected Properties
  protected readonly columnTypeControl = new FormControl<ColumnType>(
    ColumnType.newColumn,
  );
  protected readonly isExistingColumn = signal(false);

  protected faClose = faClose;

  // #endregion

  // #region Lifecycle Hooks
  ngOnInit(): void {
    this.columnTypeControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((value) => {
        this.isExistingColumn.set(value !== ColumnType.newColumn);
      });

    this.columnTypeControl.setValue(
      this.existingColumn ? ColumnType.existingColumn : ColumnType.newColumn,
    );
    if (this.column || this.existingColumn) {
      this.columnTypeControl.disable();
    }
  }

  // #endregion

  // #region Methods
  onCloseModal(isChange = false): void {
    this.controller.dismiss(isChange);
  }
  // #endregion

  showAddColumnForm() {
    this.isExistingColumn.set(false);
  }

  showExistingColumnsForm() {
    this.isExistingColumn.set(true);
  }
}
