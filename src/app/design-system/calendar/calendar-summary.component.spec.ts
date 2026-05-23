import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CalendarSummaryComponent } from './calendar-summary.component';
import { DsCalendarSummaryConfig } from './calender.interface';
import { Component } from '@angular/core';

@Component({
  selector: 'test-host-calendar-summary',
  template: `<ds-calendar-summary [summaryConfig]="summaryConfig" />`,
  standalone: true,
  imports: [CalendarSummaryComponent],
})
class TestHostComponent {
  summaryConfig: DsCalendarSummaryConfig[] | undefined = undefined;
}

describe('CalendarSummaryComponent', () => {
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

  it('should render nothing if summaryConfig is undefined', () => {
    host.summaryConfig = undefined;
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.container');
    expect(container).toBeFalsy();
  });

  it('should render nothing if summaryConfig is empty', () => {
    host.summaryConfig = [];
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.container');
    expect(container).toBeFalsy();
  });

  it('should render summary items for each config', () => {
    host.summaryConfig = [
      {
        icon: 'present',
        count: 5,
        label: 'Present',
        cssClass: 'test-class',
        children: [],
      },
      {
        icon: 'absent',
        count: 2,
        label: 'Absent',
        cssClass: '',
        children: [
          { icon: 'excused', count: 1, label: 'Excused' },
          { icon: 'unexcused', count: 1, label: 'Unexcused' },
        ],
      },
    ];
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.container-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Present');
    expect(items[1].textContent).toContain('Absent');
  });

  it('should render child items for each config', () => {
    host.summaryConfig = [
      {
        icon: 'absent',
        count: 2,
        label: 'Absent',
        cssClass: '',
        children: [
          { icon: 'excused', count: 1, label: 'Excused' },
          { icon: 'unexcused', count: 1, label: 'Unexcused' },
        ],
      },
    ];
    fixture.detectChanges();
    const childItems = fixture.nativeElement.querySelectorAll(
      '[data-summary-child]',
    );
    expect(childItems.length).toBe(2);
    expect(childItems[0].textContent).toContain('Excused');
    expect(childItems[1].textContent).toContain('Unexcused');
  });

  it('should apply correct cssClass to summary item', () => {
    host.summaryConfig = [
      {
        icon: 'present',
        count: 5,
        label: 'Present',
        cssClass: 'test-class',
        children: [],
      },
    ];
    fixture.detectChanges();
    const largeItem = fixture.nativeElement.querySelector('.large-item');
    expect(largeItem.className).toContain('test-class');
  });

  it('should handle config with missing childrens', () => {
    host.summaryConfig = [
      {
        icon: 'present',
        count: 5,
        label: 'Present',
        cssClass: '',
        children: undefined as any,
      },
    ];
    fixture.detectChanges();
    const childItems =
      fixture.nativeElement.querySelectorAll('.flex.items-center');
    expect(childItems.length).toBe(0);
  });
});
