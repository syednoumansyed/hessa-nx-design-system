import { getLocalizedFullName } from '@shared/utils/localization.util';
import { LatestJournalEntryDTO } from './student-journals.dto';
import { JournalCardData } from './student-journals.interface';
import { ensureArray } from '@shared/utils/array.util';

export const STUDENT_JOURNALS_MAP_FROM_DTO = new (class {
  feedLatestJournals(dto: LatestJournalEntryDTO[]): JournalCardData[] {
    return ensureArray(dto).map((journal) => this.feedLatestJournal(journal));
  }

  feedLatestJournal(dto: LatestJournalEntryDTO): JournalCardData {
    return {
      id: dto.id,
      displayName: getLocalizedFullName(dto),
      avatar: dto.imageUrl ?? null,
      studentId: dto.studentId,
      updatedAt: dto.updatedAt,
      createdAt: dto.createdAt,
      journalDate: dto.journalDate,
      type: dto.type,
      viewed: dto.viewedByGuardian,
      viewedByGuardian: dto.viewedByGuardian,
      profileColor: dto.profileColor,
    };
  }
})();
