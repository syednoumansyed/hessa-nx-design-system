/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  DsStudentSelectorComponent,
  Student,
} from './student-selector.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { LayoutService } from '@layout/layout.service';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('DsStudentSelectorComponent', () => {
  let component: DsStudentSelectorComponent;
  let fixture: ComponentFixture<DsStudentSelectorComponent>;
  let mockTranslateService: jasmine.SpyObj<HesTranslateService>;
  let mockLayoutService: jasmine.SpyObj<LayoutService>;

  const mockStudents: Student[] = [
    {
      id: '1',
      fullName: 'John Doe',
      class: '5A',
      level: '5',
      imageUrl: 'https://example.com/john.jpg',
    },
    {
      id: '2',
      fullName: 'Jane Smith',
      class: '6B',
      level: '6',
      imageUrl: 'https://example.com/jane.jpg',
    },
    {
      id: '3',
      fullName: 'Very Long Student Name That Should Be Truncated',
      class: '7C',
      level: '7',
      imageUrl: 'https://example.com/long.jpg',
    },
  ];

  beforeEach(async () => {
    mockTranslateService = jasmine.createSpyObj('HesTranslateService', ['t']);
    mockTranslateService.t.and.callFake((key: string) => {
      const translations: { [key: string]: string } = {
        'global.all.txt': 'All',
        'global.all_students.title': 'All Students',
        'global.class.label': 'Class',
      };
      return translations[key] || key;
    });

    mockLayoutService = jasmine.createSpyObj('LayoutService', [
      'isMobileOrTablet',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        DsStudentSelectorComponent,
        AvatarComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              'global.class.label': 'Class',
            },
          },
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [
        { provide: HesTranslateService, useValue: mockTranslateService },
        { provide: LayoutService, useValue: mockLayoutService },
      ],
    }).compileComponents();
  });

  // Helper function to create component with specific mobile setting
  const createComponentWithMobileSetting = (isMobile: boolean) => {
    mockLayoutService.isMobileOrTablet.and.returnValue(isMobile);

    const testFixture = TestBed.createComponent(DsStudentSelectorComponent);
    const testComponent = testFixture.componentInstance;

    return { fixture: testFixture, component: testComponent };
  };

  describe('Component Initialization', () => {
    beforeEach(() => {
      const result = createComponentWithMobileSetting(false);
      fixture = result.fixture;
      component = result.component;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.students).toEqual([]);
      expect(component.defaultSelectedId).toBe('0');
      expect(component.enableAllOption).toBe(false);
      expect(component.selectedStudent).toBeUndefined();
    });

    it('should detect mobile platform', () => {
      const mobileResult = createComponentWithMobileSetting(true);
      expect(mobileResult.component.isMobile()).toBe(true);
    });

    it('should detect desktop platform', () => {
      const desktopResult = createComponentWithMobileSetting(false);
      expect(desktopResult.component.isMobile()).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    beforeEach(() => {
      const result = createComponentWithMobileSetting(false);
      fixture = result.fixture;
      component = result.component;
      component.students = [...mockStudents];
    });

    it('should add selectAllObject to beginning of students array', () => {
      component.enableAllOption = true;
      component.ngOnInit();
      expect(component.students.length).toBe(mockStudents.length + 1);
      expect(component.students[0].id).toBe('0');
      expect(component.students[0].fullName).toBe('All Students');
    });

    it('should set selectedStudent to selectAllObject by default', () => {
      component.enableAllOption = true;
      component.ngOnInit();
      expect(component.selectedStudent?.id).toBe('0');
    });

    it('should set selectedStudent to specified defaultSelectedId', () => {
      component.defaultSelectedId = '2';
      component.ngOnInit();
      expect(component.selectedStudent?.id).toBe('2');
      expect(component.selectedStudent?.fullName).toBe('Jane Smith');
    });

    it('should fallback to selectAllObject if defaultSelectedId not found', () => {
      component.enableAllOption = true;
      component.defaultSelectedId = 'non-existent';
      component.ngOnInit();
      expect(component.selectedStudent?.id).toBe('0');
    });

    it('should create different selectAllObject for mobile', () => {
      const mobileResult = createComponentWithMobileSetting(true);
      mobileResult.component.students = [...mockStudents];
      mobileResult.component.enableAllOption = true;

      // Verify isMobile is set correctly before calling ngOnInit
      expect(mobileResult.component.isMobile()).toBe(true);

      mobileResult.component.ngOnInit();

      expect(mobileResult.component.selectAllObject.fullName).toBe('All');
      expect(mobileResult.component.selectAllObject.imageUrl).toContain(
        'heart-two-tone-sm',
      );
    });

    it('should create different selectAllObject for desktop', () => {
      const desktopResult = createComponentWithMobileSetting(false);
      desktopResult.component.students = [...mockStudents];
      desktopResult.component.enableAllOption = true;

      // Verify isMobile is set correctly before calling ngOnInit
      expect(desktopResult.component.isMobile()).toBe(false);

      desktopResult.component.ngOnInit();

      expect(desktopResult.component.selectAllObject.fullName).toBe(
        'All Students',
      );
      expect(desktopResult.component.selectAllObject.imageUrl).toContain(
        'heart-two-tone',
      );
      expect(desktopResult.component.selectAllObject.imageUrl).not.toContain(
        'heart-two-tone-sm',
      );
    });

    it('should not add selectAllObject when enableAllOption is false', () => {
      component.enableAllOption = false;
      component.students = [...mockStudents];
      component.ngOnInit();

      expect(component.students.length).toBe(mockStudents.length);
      expect(component.students[0].id).toBe('1'); // First actual student
    });

    it('should select first student when enableAllOption is false and no defaultSelectedId', () => {
      component.enableAllOption = false;
      component.students = [...mockStudents];
      component.ngOnInit();

      expect(component.selectedStudent?.id).toBe('1');
      expect(component.selectedStudent?.fullName).toBe('John Doe');
    });
  });

  describe('onSelectStudent', () => {
    beforeEach(() => {
      const result = createComponentWithMobileSetting(false);
      fixture = result.fixture;
      component = result.component;
      component.students = [...mockStudents];
      component.enableAllOption = true;
      component.ngOnInit();
    });

    it('should update selectedStudent', () => {
      const student = mockStudents[1];
      component.onSelectStudent(student);
      expect(component.selectedStudent).toBe(student);
    });

    it('should emit studentSelected event', () => {
      spyOn(component.studentSelected, 'emit');
      const student = mockStudents[1];
      component.onSelectStudent(student);
      expect(component.studentSelected.emit).toHaveBeenCalledWith(student);
    });
  });

  describe('Desktop Template', () => {
    beforeEach(() => {
      const result = createComponentWithMobileSetting(false);
      fixture = result.fixture;
      component = result.component;
      component.students = [...mockStudents];
      component.enableAllOption = true;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should render desktop layout', () => {
      const desktopContainer = fixture.debugElement.query(
        By.css('.rounded-ds-2xl'),
      );
      expect(desktopContainer).toBeTruthy();
    });

    it('should render all students including selectAll', () => {
      const studentItems = fixture.debugElement.queryAll(
        By.css('.flex.cursor-pointer'),
      );
      expect(studentItems.length).toBe(4);
    });

    it('should show avatar for other students', () => {
      const studentItems = fixture.debugElement.queryAll(
        By.css('.flex.cursor-pointer'),
      );
      const thirdItem = studentItems[2];
      const avatar = thirdItem.query(By.css('app-ds-avatar'));
      expect(avatar).toBeTruthy();

      expect(avatar.attributes['size']).toBe('sm');
    });

    it('should display student names', () => {
      const studentItems = fixture.debugElement.queryAll(
        By.css('.flex.cursor-pointer'),
      );

      expect(studentItems.length).toBe(4);

      const firstItemName = studentItems[0].query(
        By.css('.heading-h5-high-emphasis'),
      );
      expect(firstItemName.nativeElement.textContent.trim()).toBe(
        'All Students',
      );

      const thirdItemName = studentItems[2].query(
        By.css('.heading-h5-high-emphasis'),
      );
      expect(thirdItemName.nativeElement.textContent.trim()).toBe('Jane Smith');
    });

    it('should display class and level for non-first items', () => {
      const studentItems = fixture.debugElement.queryAll(
        By.css('.flex.cursor-pointer'),
      );
      const thirdItem = studentItems[2];
      const classLevelContainer = thirdItem.query(
        By.css('.flex.items-center.gap-ds-lg'),
      );
      const classLevelItems = classLevelContainer.queryAll(
        By.css('.single-line-caption-mid-emphasis'),
      );

      expect(classLevelItems.length).toBe(2);
      expect(classLevelItems[0].nativeElement.textContent.trim()).toBe('6');
      expect(classLevelItems[1].nativeElement.textContent.trim()).toBe('6B');
    });

    it('should apply selected styles to selected student', () => {
      component.selectedStudent = component.students[2];
      fixture.detectChanges();

      const studentItems = fixture.debugElement.queryAll(
        By.css('.flex.cursor-pointer'),
      );
      const selectedItem = studentItems[2];
      expect(selectedItem.nativeElement.classList).toContain('bg-brand-200');
    });

    it('should handle click events', () => {
      spyOn(component, 'onSelectStudent');
      const studentItems = fixture.debugElement.queryAll(
        By.css('.flex.cursor-pointer'),
      );
      const thirdItem = studentItems[2];

      thirdItem.nativeElement.click();
      expect(component.onSelectStudent).toHaveBeenCalledWith(
        component.students[2],
      );
    });
  });

  describe('Mobile Template', () => {
    let mobileFixture: ComponentFixture<DsStudentSelectorComponent>;
    let mobileComponent: DsStudentSelectorComponent;

    beforeEach(() => {
      const result = createComponentWithMobileSetting(true);
      mobileFixture = result.fixture;
      mobileComponent = result.component;
      mobileComponent.students = [...mockStudents];
      mobileComponent.enableAllOption = true;
      mobileComponent.ngOnInit();
      mobileFixture.detectChanges();
    });

    it('should render all students including selectAll', () => {
      const studentCards = mobileFixture.debugElement.queryAll(
        By.css('.rounded-ds-full'),
      );
      expect(studentCards.length).toBe(4);
    });

    it('should show avatar for other students with xs size', () => {
      const studentCards = mobileFixture.debugElement.queryAll(
        By.css('.rounded-ds-full'),
      );
      const thirdCard = studentCards[2];
      const avatar = thirdCard.query(By.css('app-ds-avatar'));
      expect(avatar).toBeTruthy();

      expect(avatar.attributes['size']).toBe('xs');
    });

    it('should apply selected styles to selected student', () => {
      mobileComponent.selectedStudent = mobileComponent.students[2];
      mobileFixture.detectChanges();

      const studentCards = mobileFixture.debugElement.queryAll(
        By.css('.rounded-ds-full'),
      );
      const selectedCard = studentCards[2];
      expect(selectedCard.nativeElement.classList).toContain('bg-brand-200');
      expect(selectedCard.nativeElement.classList).toContain(
        'border-brand-600',
      );
    });

    it('should handle click events', () => {
      spyOn(mobileComponent, 'onSelectStudent');
      const studentCards = mobileFixture.debugElement.queryAll(
        By.css('.rounded-ds-full'),
      );
      const thirdCard = studentCards[2];

      thirdCard.nativeElement.click();
      expect(mobileComponent.onSelectStudent).toHaveBeenCalledWith(
        mobileComponent.students[2],
      );
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      const result = createComponentWithMobileSetting(false);
      fixture = result.fixture;
      component = result.component;
    });

    it('should handle empty students array', () => {
      component.enableAllOption = true;
      component.students = [];
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.students.length).toBe(1);
      expect(component.students[0].id).toBe('0');
      expect(component.selectedStudent?.id).toBe('0');
    });

    it('should handle students with missing properties gracefully', () => {
      const incompleteStudent = {
        id: '999',
        fullName: 'Incomplete Student',
        class: '',
        level: '',
        imageUrl: '',
      } as Student;

      component.students = [incompleteStudent];
      component.ngOnInit();
      fixture.detectChanges();

      expect(() => {
        component.onSelectStudent(incompleteStudent);
      }).not.toThrow();
    });

    it('should maintain selection state across re-renders', () => {
      component.students = [...mockStudents];
      component.enableAllOption = true;
      component.ngOnInit();

      const targetStudent = component.students[2];
      component.onSelectStudent(targetStudent);

      component.defaultSelectedId = targetStudent.id;
      component.ngOnInit();

      fixture.detectChanges();
      expect(component.selectedStudent).toEqual(targetStudent);
      expect(component.selectedStudent?.fullName).toBe('Jane Smith');
    });

    it('should handle enableAllOption false with empty students array', () => {
      component.enableAllOption = false;
      component.students = [];
      component.ngOnInit();

      expect(component.students.length).toBe(0);
      expect(component.selectedStudent).toBeUndefined();
    });
  });

  describe('Input/Output Integration', () => {
    beforeEach(() => {
      const result = createComponentWithMobileSetting(false);
      fixture = result.fixture;
      component = result.component;
    });

    it('should accept students input', () => {
      component.students = mockStudents;
      expect(component.students).toEqual(mockStudents);
    });

    it('should accept enableAllOption input', () => {
      component.enableAllOption = true;
      expect(component.enableAllOption).toBe(true);
    });

    it('should accept defaultSelectedId input', () => {
      component.defaultSelectedId = '2';
      expect(component.defaultSelectedId).toBe('2');
    });

    it('should accept enableAllOption input', () => {
      component.enableAllOption = false;
      expect(component.enableAllOption).toBe(false);
    });

    it('should emit studentSelected output', () => {
      let emittedStudent: Student | undefined;
      component.studentSelected.subscribe((student: Student) => {
        emittedStudent = student;
      });

      const testStudent = mockStudents[0];
      component.onSelectStudent(testStudent);

      expect(emittedStudent).toBe(testStudent);
    });
  });

  describe('Translation Service Integration', () => {
    it('should call translation service for mobile text', () => {
      mockTranslateService.t.calls.reset();
      const mobileResult = createComponentWithMobileSetting(true);

      expect(mobileResult.component.isMobile()).toBe(true);

      mobileResult.component.students = [...mockStudents];
      mobileResult.component.enableAllOption = true;
      mobileResult.component.ngOnInit();

      expect(mockTranslateService.t).toHaveBeenCalledWith('global.all.txt');
    });

    it('should call translation service for desktop text', () => {
      mockTranslateService.t.calls.reset();
      const desktopResult = createComponentWithMobileSetting(false);

      expect(desktopResult.component.isMobile()).toBe(false);

      desktopResult.component.students = [...mockStudents];
      desktopResult.component.enableAllOption = true;
      desktopResult.component.ngOnInit();

      expect(mockTranslateService.t).toHaveBeenCalledWith(
        'global.all_students.title',
      );
    });
  });

  describe('LayoutService Integration', () => {
    it('should use LayoutService to determine mobile state', () => {
      mockLayoutService.isMobileOrTablet.and.returnValue(true);
      const mobileResult = createComponentWithMobileSetting(true);

      expect(mobileResult.component.isMobile()).toBe(true);
    });

    it('should use LayoutService to determine desktop state', () => {
      mockLayoutService.isMobileOrTablet.and.returnValue(false);
      const desktopResult = createComponentWithMobileSetting(false);

      expect(desktopResult.component.isMobile()).toBe(false);
    });
  });
});
