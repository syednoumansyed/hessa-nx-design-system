import { DsIcon } from '../icon/icon.component';

export interface DsCalendarEventConfig {
  date: Date;
  icon?: DsIcon;
  tooltip?: {
    title?: string;
    content?: string;
    footer?: string | null;
  };
  class?: string;
  cellType?:
    | 'danger'
    | 'success'
    | 'danger-outline'
    | 'success-outline'
    | 'exciting';
  meta?: any;
}

export interface CalendarCellData {
  date: Date;
  event?: DsCalendarEventConfig;
}

export interface DsCalendarGridRange {
  month: number;
  year: number;
  startDate: Date;
  endDate: Date;
}

export interface DsCalendarCellData {
  date: Date;
  event?: DsCalendarEventConfig;
}

/**
 * Generic interface for calendar summary grouping (e.g., present/absent summary)
 */
export interface DsCalendarSummaryConfig {
  label: string;
  icon?: DsIcon;
  count: number;
  cssClass?: string;
  children?: DsCalendarSummaryConfig[];
}

/**
 * Configuration for calendar placeholder state
 */
export interface DsCalendarPlaceholderConfig {
  /** Whether to show the placeholder */
  show: boolean;
  /** Optional title text for the placeholder */
  title?: string;
  /** Optional subtitle text for the placeholder */
  subtitle?: string;
}

export interface CalendarAlert {
  /** Title for the alert/message (e.g. "2 Vacation Days This Month") */
  title: string;
  /** Message for the alert (e.g. "Wishing you a blessed and joyful time 🌴") */
  message: string;
}

export interface DsCalendarConfig {
  events: DsCalendarEventConfig[];
  summaryConfig?: DsCalendarSummaryConfig[];
  placeholderConfig?: DsCalendarPlaceholderConfig;
  showSummary?: boolean;
  status?: string;
  alert?: CalendarAlert; // Generic alert for message in view
  /** Minimum allowed month/year for navigation */
  minMonth?: { month: number; year: number };
  /** Maximum allowed month/year for navigation */
  maxMonth?: { month: number; year: number };
}

export interface DsCalendarReadyEvent {
  range: DsCalendarGridRange;
}
