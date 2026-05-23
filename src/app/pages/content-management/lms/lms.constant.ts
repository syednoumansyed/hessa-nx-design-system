import { AssessmentStudentSubmissionStatus } from '@shared/enums';

export const STATUS_MAP = {
  [AssessmentStudentSubmissionStatus.PENDING]: {
    textKey: 'global.new.txt',
    className: 'ds-badge-pending',
    value: AssessmentStudentSubmissionStatus.PENDING,
  },
  [AssessmentStudentSubmissionStatus.NEW]: {
    textKey: 'global.new.txt',
    className: 'ds-badge-pending',
    value: AssessmentStudentSubmissionStatus.NEW,
  },
  [AssessmentStudentSubmissionStatus.IN_PROGRESS]: {
    textKey: 'global.in_progress.txt',
    className: 'ds-badge-in-progress',
    value: AssessmentStudentSubmissionStatus.IN_PROGRESS,
  },
  [AssessmentStudentSubmissionStatus.MISSED]: {
    textKey: 'global.missed.txt',
    className: 'ds-badge-missed',
    value: AssessmentStudentSubmissionStatus.MISSED,
  },
  [AssessmentStudentSubmissionStatus.SUBMITTED]: {
    textKey: 'content_management.assignments_submitted.txt',
    className: 'ds-badge-submitted',
    value: AssessmentStudentSubmissionStatus.SUBMITTED,
  },
};
