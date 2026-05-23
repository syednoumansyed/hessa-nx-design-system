import { ObjId } from '@shared/interfaces/common.interface';
import { JournalStatus } from './journal.enum';
import { JournalsResponseDTO } from './journal.dto';
import { inject } from '@angular/core';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { Journal } from './journal.interface';

export interface IJournalListItem {
  id: ObjId | null;
  displayName: string;
  journalDate: string;
  levelName: string;
  levelId: string;
  className: string;
  classId: string;
  studentId: ObjId | null;
  nationalId: string;
  publishDate: string | null;
  acknowledgementComment: string;
  status: JournalStatus;
  isNewStatus: boolean;
  viewedByGuardian: boolean;
  journalEndDate: string | null;
  isWeekly: boolean;
}

export function mapJournalsToListItems(data: Journal[]): IJournalListItem[] {
  return data.map((journal) => {
    return {
      id: journal.id,
      displayName: journal.displayName,
      journalDate: journal.journalDate,
      levelName: journal.levelDisplayName,
      levelId: journal.levelId.toString(),
      className: journal.classDisplayName,
      classId: journal.classId.toString(),
      nationalId: journal.nationalId,
      studentId: journal.studentId,
      publishDate: journal.publishDate,
      acknowledgementComment: journal.acknowledgementComment ?? '-',
      status: journal.status as JournalStatus,
      isNewStatus: journal.status === JournalStatus.NEW,
      type: journal.type,
      viewedByGuardian: !!journal.viewedByGuardian,
      journalEndDate: journal.journalEndDate,
      isWeekly: journal.type === 'WEEKLY',
    };
  });
}

export function createJournalDateRenderer() {
  const datePipe = inject(HesDatePipe);
  return (params: any) => {
    const data = params.data as IJournalListItem;
    if (data.isWeekly && data.journalEndDate) {
      return `${datePipe.transform(data.journalDate)} - ${datePipe.transform(data.journalEndDate)}`;
    }
    return datePipe.transform(data.journalDate);
  };
}
