import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CalendarMonthComponent } from './calendar-month.component';
import {
  DsCalendarConfig,
  DsCalendarSummaryConfig,
  DsCalendarPlaceholderConfig,
} from './calender.interface';
import { Component } from '@angular/core';

@Component({
  selector: 'test-host-calendar-month',
  template: `<ds-calendar-month
    [month]="month"
    [year]="year"
    [locale]="locale"
    [dayLabels]="dayLabels"
    [config]="config"
  />`,
  standalone: true,
  imports: [CalendarMonthComponent],
})
class TestHostComponent {
  // Set default to a month/year always in the past to avoid isNextMonthDisabled logic
  month = 0;
  year = 2000;
  locale = 'en';
  dayLabels: string[] | undefined = undefined;
  config: DsCalendarConfig = {
    events: [],
    showSummary: false,
    summaryConfig: [],
    placeholderConfig: undefined,
    status: undefined,
    alert: undefined,
  };
}

describe('CalendarMonthComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should render month name and year', () => {
    const heading = fixture.nativeElement.querySelector(
      '.heading-h4-high-emphasis',
    );
    const expectedMonth = new Date(host.year, host.month).toLocaleString('en', {
      month: 'long',
    });
    expect(heading.textContent).toContain(expectedMonth);
    expect(heading.textContent).toContain(host.year.toString());
  });

  it('should render week labels', () => {
    const weekLabels = fixture.nativeElement.querySelectorAll(
      'ds-calendar-cell > div[data-week-label="true"]',
    );
    expect(weekLabels.length).toBe(7);
  });

  it('should render day cells', () => {
    const dayCells = fixture.nativeElement.querySelectorAll(
      'ds-calendar-cell > div[data-week-label="false"]',
    );
    expect(dayCells.length).toBeGreaterThan(0);
  });

  it('should show placeholder when showPlaceholder is true', () => {
    host.config = {
      ...host.config,
      placeholderConfig: {
        show: true,
        title: 'No Data',
        subtitle: 'No events',
      },
    };
    fixture.detectChanges();
    const placeholder = fixture.nativeElement.querySelector(
      '[data-calendar-placeholder]',
    );
    expect(placeholder).toBeTruthy();
    expect(placeholder.textContent).toContain('No Data');
    expect(placeholder.textContent).toContain('No events');
  });

  it('should show alert message when alert is set', () => {
    const alertCofnig = { title: 'Alert', message: 'Something happened' };
    host.config = {
      ...host.config,
      alert: alertCofnig,
    };
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('alert-message');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Alert');
    expect(alert.textContent).toContain('Something happened');
  });

  it('should show status when status is set', () => {
    host.config = {
      ...host.config,
      status: 'Status message',
    };
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('[calendar-status]');
    expect(status.textContent).toContain('Status message');
  });

  it('should render summary when showSummary is true', () => {
    host.config = {
      ...host.config,
      showSummary: true,
      summaryConfig: [
        {
          icon: 'present',
          count: 5,
          label: 'Present',
          cssClass: '',
          children: [],
        },
      ] as DsCalendarSummaryConfig[],
    };
    fixture.detectChanges();

    const summary = fixture.nativeElement.querySelector('ds-calendar-summary');
    expect(summary).toBeTruthy();
    console.log(summary.textContent);
    expect(summary.textContent).toContain('Present');
  });

  it('should call prevMonth and emit event', () => {
    host.month = 1; // February 2000
    host.year = 2000;
    fixture.detectChanges();
    const calendarMonth = fixture.debugElement.children[0]
      .componentInstance as CalendarMonthComponent;
    spyOn(calendarMonth.monthChange, 'emit');
    const prevBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Previous Month"]',
    );
    prevBtn.click();
    expect(calendarMonth.monthChange.emit).toHaveBeenCalled();
  });

  it('should call nextMonth and emit event', () => {
    host.month = 1; // February 2000
    host.year = 2000;
    fixture.detectChanges();
    const calendarMonth = fixture.debugElement.children[0]
      .componentInstance as CalendarMonthComponent;
    spyOn(calendarMonth.monthChange, 'emit');
    const nextBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Next Month"]',
    );
    nextBtn.click();
    expect(calendarMonth.monthChange.emit).toHaveBeenCalled();
  });

  it('should handle empty config and no events', () => {
    host.config = {
      events: [],
      showSummary: false,
      summaryConfig: [],
      placeholderConfig: undefined,
      status: undefined,
      alert: undefined,
    };
    fixture.detectChanges();
    const dayCells = fixture.nativeElement.querySelectorAll(
      'ds-calendar-cell > div[data-week-label="false"]',
    );
    expect(dayCells.length).toBeGreaterThan(0);
  });

  it('should render multiple summary items and children', () => {
    host.config = {
      ...host.config,
      showSummary: true,
      summaryConfig: [
        {
          icon: 'present',
          count: 5,
          label: 'Present',
          cssClass: '',
          children: [{ icon: 'excused', count: 2, label: 'Excused' }],
        },
        {
          icon: 'absent',
          count: 2,
          label: 'Absent',
          cssClass: '',
          children: [],
        },
      ] as DsCalendarSummaryConfig[],
    };
    fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('ds-calendar-summary');
    expect(summary).toBeTruthy();

    // Parent summary items
    const items = summary.querySelectorAll('[data-summary-item]');
    expect(items.length).toBe(2);

    const parentLabels = summary.querySelectorAll('[data-summary-label]');
    expect(
      Array.from(parentLabels).map((l) =>
        (l as HTMLElement).textContent?.trim(),
      ),
    ).toEqual(jasmine.arrayContaining(['Present', 'Absent']));

    // Child summary items
    const childItems = summary.querySelectorAll('[data-summary-child]');
    expect(childItems.length).toBe(1);

    const childLabels = summary.querySelectorAll('[data-summary-child-label]');
    expect(
      Array.from(childLabels).map((l) =>
        (l as HTMLElement).textContent?.trim(),
      ),
    ).toContain('Excused');
  });

  it('should render summary container if showSummary true but summaryConfig empty', () => {
    host.config = {
      ...host.config,
      showSummary: true,
      summaryConfig: [],
    };
    fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('ds-calendar-summary');
    expect(summary).toBeTruthy();
  });

  it('should render custom day labels', () => {
    host.dayLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    fixture.detectChanges();
    const weekLabels = fixture.nativeElement.querySelectorAll(
      'ds-calendar-cell > div[data-week-label="true"]',
    );
    expect(weekLabels.length).toBe(7);
    expect(weekLabels[0].textContent).toContain('A');
    expect(weekLabels[6].textContent).toContain('G');
  });

  it('should render Arabic locale labels', () => {
    host.locale = 'ar';
    host.dayLabels = undefined;
    fixture.detectChanges();
    const weekLabels = fixture.nativeElement.querySelectorAll(
      'ds-calendar-cell > div[data-week-label="true"]',
    );
    expect(weekLabels[0].textContent).toContain('ا');
  });

  it('should style today cell', () => {
    const today = new Date();
    host.month = today.getMonth();
    host.year = today.getFullYear();
    host.config = {
      ...host.config,
      events: [{ date: today, cellType: 'success' }],
    };
    fixture.detectChanges();
    const dayCells = fixture.nativeElement.querySelectorAll(
      'ds-calendar-cell > div[data-week-label="false"]',
    );
    const found = Array.from(dayCells).some((cell) =>
      (cell as HTMLElement).className?.includes('bg-feedback-stroke-positive'),
    );
    expect(found).toBeTrue();
  });

  it('should handle prevMonth at year boundary', () => {
    host.month = 0; // January 2000
    host.year = 2000;
    fixture.detectChanges();
    const calendarMonth = fixture.debugElement.children[0]
      .componentInstance as CalendarMonthComponent;
    spyOn(calendarMonth.monthChange, 'emit');
    const prevBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Previous Month"]',
    );
    prevBtn.click();
    expect(calendarMonth.monthChange.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ month: 11, year: 1999 }),
    );
  });

  it('should handle nextMonth at year boundary', () => {
    host.month = 11; // December 2000
    host.year = 2000;
    fixture.detectChanges();
    const calendarMonth = fixture.debugElement.children[0]
      .componentInstance as CalendarMonthComponent;
    spyOn(calendarMonth.monthChange, 'emit');
    const nextBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Next Month"]',
    );
    nextBtn.click();
    expect(calendarMonth.monthChange.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ month: 0, year: 2001 }),
    );
  });

  it('should show placeholder with only title', () => {
    host.config = {
      ...host.config,
      placeholderConfig: { show: true, title: 'Only Title' },
    };
    fixture.detectChanges();
    const placeholder = fixture.nativeElement.querySelector(
      '[data-calendar-placeholder]',
    );
    expect(placeholder.textContent).toContain('Only Title');
  });

  it('should show placeholder with only subtitle', () => {
    host.config = {
      ...host.config,
      placeholderConfig: { show: true, subtitle: 'Only Subtitle' },
    };
    fixture.detectChanges();
    const placeholder = fixture.nativeElement.querySelector(
      '[data-calendar-placeholder]',
    );
    expect(placeholder.textContent).toContain('Only Subtitle');
  });

  it('should show alert with only title', () => {
    host.config = {
      ...host.config,
      alert: { title: 'Only Title', message: '' },
    };
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('alert-message');
    expect(alert.textContent).toContain('Only Title');
  });

  it('should show alert with only message', () => {
    host.config = {
      ...host.config,
      alert: { title: '', message: 'Only Message' },
    };
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('alert-message');
    expect(alert.textContent).toContain('Only Message');
  });
});
