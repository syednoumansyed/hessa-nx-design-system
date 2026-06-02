import {
  Meta,
  StoryObj,
  applicationConfig,
  moduleMetadata,
  componentWrapperDecorator,
} from '@storybook/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import {
  AttendanceCalendarComponent,
  AttendanceEventType,
  AbsenceType,
} from '@ds/calendar/attendance-calendar.component';
import { DS_TRANSLATION_TOKEN } from '@ds/i18n/ds-translation.token';

const translationProvider = {
  provide: DS_TRANSLATION_TOKEN,
  useValue: {
    translate: (key: string, params?: any) => {
      // Basic mock translation dictionary
      const translations: Record<string, string> = {
        'attendance.present.title': 'Present',
        'attendance.absent.title': 'Absent',
        'attendance.excused.title': 'Excused',
        'attendance.late.title': 'Late Arrival',
        'attendance.planned.title': 'Planned Leave',
        'attendance.not_planned_absence.title': 'Unplanned Absence',
        'attendance.vacation.total_days_month.title':
          '{{days}} Vacation Days This Month',
        'attendance.vacation_wish': 'Wishing you a blessed and joyful time 🌴',
        'attendance.todaystatus.attended_on_time': 'Attended on time today',
      };
      let text = translations[key] || key;
      if (params && params.days !== undefined) {
        text = text.replace('{{days}}', params.days.toString());
      }
      return text;
    },
    getActiveLang: () => 'en',
  },
};

/**
 * # Attendance Calendar — `ds-attendance-calendar`
 *
 * A high-fidelity responsive calendar display showing student attendance records.
 * Integrates daily statuses (Present, Absent, Excused, Late, Holiday) with interactive tooltips
 * and summary analytics.
 *
 * **When to use:**
 * - To show monthly attendance records to parents, students, or personnel.
 * - Interactive dashboards where dates can be clicked for detailed status.
 */
const meta: Meta<AttendanceCalendarComponent> = {
  title: '3. P2 Components/Attendance Calendar',
  component: AttendanceCalendarComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideIonicAngular(), translationProvider],
    }),
    moduleMetadata({ imports: [AttendanceCalendarComponent] }),
    componentWrapperDecorator(
      (story) =>
        `<div style="max-width:480px;margin:0 auto;padding:16px;">${story}</div>`,
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    month: {
      control: { type: 'number', min: 0, max: 11, step: 1 },
      description: 'Zero-based month index used by the attendance calendar.',
    },
    year: {
      control: { type: 'number', min: 2020, max: 2035, step: 1 },
      description: 'Calendar year.',
    },
    config: {
      control: 'object',
      description:
        'Attendance dates, monthly statistics, attendance totals, and student display data.',
    },
    local: {
      control: 'select',
      options: ['en', 'ar'],
      description: 'Locale used by the calendar translation display.',
    },
  },
};

export default meta;
type Story = StoryObj<AttendanceCalendarComponent>;

const mockDates = [
  {
    id: 1,
    date: '2026-05-04',
    attendanceStatus: AttendanceEventType.PRESENT,
    confirmationStatus: 'CONFIRMED' as const,
    reason: null,
    type: 'AUTO',
    day: 4,
    isHoliday: false,
    isWeekend: false,
  },
  {
    id: 2,
    date: '2026-05-05',
    attendanceStatus: AttendanceEventType.PRESENT,
    confirmationStatus: 'CONFIRMED' as const,
    reason: null,
    type: 'AUTO',
    day: 5,
    isHoliday: false,
    isWeekend: false,
  },
  {
    id: 3,
    date: '2026-05-06',
    attendanceStatus: AttendanceEventType.LATE_ARRIVAL,
    confirmationStatus: 'CONFIRMED' as const,
    reason: 'Heavy traffic',
    type: 'MANUAL',
    day: 6,
    isHoliday: false,
    isWeekend: false,
  },
  {
    id: 4,
    date: '2026-05-07',
    attendanceStatus: AttendanceEventType.ABSENT,
    confirmationStatus: 'CONFIRMED' as const,
    reason: 'Sickness',
    type: 'MANUAL',
    day: 7,
    isHoliday: false,
    isWeekend: false,
    absenceType: AbsenceType.UNPLANNED,
  },
  {
    id: 5,
    date: '2026-05-11',
    attendanceStatus: AttendanceEventType.PRESENT,
    confirmationStatus: 'CONFIRMED' as const,
    reason: null,
    type: 'AUTO',
    day: 11,
    isHoliday: false,
    isWeekend: false,
  },
  {
    id: 6,
    date: '2026-05-12',
    attendanceStatus: AttendanceEventType.EXCUSED,
    confirmationStatus: 'CONFIRMED' as const,
    reason: 'Dentist appointment',
    type: 'MANUAL',
    day: 12,
    isHoliday: false,
    isWeekend: false,
  },
  {
    id: 7,
    date: '2026-05-13',
    attendanceStatus: AttendanceEventType.ON_LEAVE,
    confirmationStatus: 'CONFIRMED' as const,
    reason: 'Family trip',
    type: 'MANUAL',
    day: 13,
    isHoliday: false,
    isWeekend: false,
  },
  {
    id: 8,
    date: '2026-05-25',
    dateObj: new Date('2026-05-25'),
    confirmationStatus: 'CONFIRMED' as const,
    reason: null,
    type: 'SYSTEM',
    day: 25,
    isHoliday: true,
    isWeekend: false,
    holiday: {
      displayName: 'National Day Holiday 🇸🇦',
    },
  },
];

const mockConfig = {
  dates: mockDates,
  status: 'Attended on time today',
  calenderStats: {
    fromDate: '2026-05-01',
    toDate: '2026-05-31',
    summary: {
      HOLIDAYS: 1,
      WEEKEND_DAYS: 10,
      WEEKDAYS: 21,
    },
  },
  attendanceStats: {
    fromDate: '2026-05-01',
    toDate: '2026-05-31',
    summary: {
      TOTAL: 31,
      TOTAL_PRESENTS: 4,
      TOTAL_ABSENTS: 2,
      PRESENT: 3,
      ABSENT: 1,
      LATE_ARRIVAL: 1,
      EXCUSED: 1,
      ON_LEAVE: 1,
      PLANNED: 0,
      UNPLANNED: 1,
    },
  },
  student: {
    fullName: 'Sara Al-Mansoori',
  },
};

export const Default: Story = {
  args: {
    month: 4, // May is index 4
    year: 2026,
    config: mockConfig,
    local: 'en',
  },
};

// ─── LTR ─────────────────────────────────────────────────────────────────────

export const LTR: Story = {
  name: 'LTR (English)',
  args: {
    month: 4,
    year: 2026,
    config: mockConfig,
    local: 'en',
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="en" dir="ltr" style="font-family:'Nunito',sans-serif;">${story}</div>`,
    ),
  ],
};

// ─── RTL ─────────────────────────────────────────────────────────────────────

export const RTL: Story = {
  name: 'RTL (Arabic)',
  args: {
    month: 4,
    year: 2026,
    config: mockConfig,
    local: 'ar',
  },
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div lang="ar" dir="rtl" style="font-family:'Lama Rounded',sans-serif;">${story}</div>`,
    ),
  ],
};
