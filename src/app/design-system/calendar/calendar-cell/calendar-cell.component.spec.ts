import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { CalendarCellComponent } from './calendar-cell.component';
import { DsCalendarEventConfig } from '../calender.interface';
import { Component } from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';

@Component({
  selector: 'test-host-calendar-cell',
  template: `<ds-calendar-cell
    [label]="label"
    [event]="event"
    [date]="date"
    [isWeekLabel]="isWeekLabel"
    [dayIndex]="dayIndex"
    [isOutOfMonth]="isOutOfMonth"
  />`,
  standalone: true,
  imports: [CalendarCellComponent],
})
class TestHostComponent {
  label: string | number | undefined = undefined;
  event: DsCalendarEventConfig | undefined = undefined;
  date: Date | undefined = undefined;
  isWeekLabel = false;
  dayIndex = 0;
  isOutOfMonth = false;
}

describe('CalendarCellComponent', () => {
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

  it('should render label if provided', () => {
    host.label = 'fr';
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.textContent).toContain('fr');
  });

  it('should render date if label is not provided', () => {
    host.label = undefined;
    host.date = new Date(2025, 6, 10);
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.textContent).toContain('10');
  });

  it('should show week label style', () => {
    host.isWeekLabel = true;
    host.dayIndex = 2;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.className).toContain('text-emphasis-mid');
    expect(cell.className).toContain('border-transparent');
  });

  it('should show today style with success event', () => {
    const today = new Date();
    host.date = today;
    host.isWeekLabel = false;
    host.dayIndex = today.getDay();
    host.event = { cellType: 'success' } as DsCalendarEventConfig;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.className).toContain('bg-feedback-stroke-positive');
    expect(cell.className).toContain('border-feedback-surface-positive');
    expect(cell.className).toContain('text-content-high-inverse');
  });

  it('should show today style with danger event', () => {
    const today = new Date();
    host.date = today;
    host.isWeekLabel = false;
    host.dayIndex = today.getDay();
    host.event = { cellType: 'danger' } as DsCalendarEventConfig;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.className).toContain('bg-feedback-stroke-danger');
    expect(cell.className).toContain('border-error-fill');
    expect(cell.className).toContain('text-content-high-inverse');
  });

  it('should show today style with no event', () => {
    const today = new Date();
    host.date = today;
    host.isWeekLabel = false;
    host.dayIndex = today.getDay();
    host.event = undefined;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.className).toContain('border-stroke-high');
    expect(cell.className).toContain('bg-icon-high');
    expect(cell.className).toContain('text-content-high-inverse');
  });

  it('should show vacation style (exciting event)', () => {
    host.date = new Date(2025, 6, 10);
    host.isWeekLabel = false;
    host.dayIndex = host.date.getDay();
    host.event = { cellType: 'exciting' } as DsCalendarEventConfig;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.className).toContain('border-indigo-50');
    expect(cell.className).toContain('text-content-high-inverse');
    expect(cell.className).toContain(
      '[background:repeating-linear-gradient(-45deg,#7C3FF1_0px,#7C3FF1_2px,#9D67F5_2px,#9D67F5_4px)]',
    );
  });

  it('should show weekend style for Friday', () => {
    host.isWeekLabel = false;
    host.dayIndex = 5;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.className).toContain('text-emphasis-low');
  });

  it('should show weekend style for Saturday', () => {
    host.isWeekLabel = false;
    host.dayIndex = 6;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.className).toContain('text-emphasis-low');
  });

  it('should show working day style for Wednesday', () => {
    host.isWeekLabel = false;
    host.dayIndex = 3;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.className).toContain('text-emphasis-mid');
  });

  it('should apply out-of-month styling with danger', () => {
    host.isOutOfMonth = true;
    host.event = { cellType: 'danger-outline' } as DsCalendarEventConfig;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.className).toContain('opacity-50');
    expect(cell.className).toContain('text-feedback-stroke-danger');
    expect(cell.className).toContain('border-transparent');
  });

  it('should apply out-of-month styling success', () => {
    host.isOutOfMonth = true;
    host.event = { cellType: 'success-outline' } as DsCalendarEventConfig;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.className).toContain('opacity-50');
    expect(cell.className).toContain('text-feedback-stroke-positive');
    expect(cell.className).toContain('border-transparent');
  });

  it('should show icon if event and not out-of-month', () => {
    host.isOutOfMonth = false;
    host.event = { icon: 'test-icon' } as DsCalendarEventConfig;
    fixture.detectChanges();
    const iconDiv = fixture.nativeElement.querySelector(
      'ds-calendar-cell app-ds-icon',
    );
    expect(iconDiv).toBeTruthy();
  });

  it('should not show icon if out-of-month', () => {
    host.isOutOfMonth = true;
    host.event = { icon: 'test-icon' } as DsCalendarEventConfig;
    fixture.detectChanges();
    const iconDiv = fixture.nativeElement.querySelector(
      'ds-calendar-cell app-ds-icon',
    );
    expect(iconDiv).toBeFalsy();
  });

  it('should apply out-of-month style with no event', () => {
    host.isOutOfMonth = true;
    host.event = undefined;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.className).toContain('text-emphasis-low');
    expect(cell.className).toContain('border-transparent');
  });

  it('should not show icon if event is undefined', () => {
    host.event = undefined;
    host.isOutOfMonth = false;
    fixture.detectChanges();
    const iconDiv = fixture.nativeElement.querySelector(
      'ds-calendar-cell app-ds-icon',
    );
    expect(iconDiv).toBeFalsy();
  });

  it('should display empty string if label and date are undefined', () => {
    host.label = undefined;
    host.date = undefined;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    expect(cell.textContent.trim()).toBe('');
  });

  it('should not be today if date is undefined', () => {
    host.date = undefined;
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('ds-calendar-cell > div');
    // No today styles should be present
    expect(cell.className).not.toContain('border-stroke-high');
    expect(cell.className).not.toContain('bg-icon-high');
    expect(cell.className).not.toContain('text-content-high-inverse');
  });
});
