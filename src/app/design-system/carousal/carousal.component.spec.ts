import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { TemplateRef, ElementRef } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { CarousalComponent, DsCarouselSlide } from './carousal.component';
import { DsIconComponent } from '../icon/icon.component';

describe('CarousalComponent', () => {
  let component: CarousalComponent;
  let fixture: ComponentFixture<CarousalComponent>;
  let mockTranslocoService: jasmine.SpyObj<TranslocoService>;

  const mockSlides: DsCarouselSlide[] = [
    {
      id: '1',
      boldTitle: 'Bold 1',
      regularTitle: 'Regular 1',
      isHighlighted: true,
    },
    {
      id: '2',
      boldTitle: 'Bold 2',
      regularTitle: 'Regular 2',
      isHighlighted: false,
    },
    {
      id: '3',
      boldTitle: 'Bold 3',
      regularTitle: 'Regular 3',
      isHighlighted: false,
    },
  ];

  beforeEach(async () => {
    const translocoSpy = jasmine.createSpyObj('TranslocoService', [
      'getActiveLang',
    ]);

    await TestBed.configureTestingModule({
      imports: [CarousalComponent, DsIconComponent],
      providers: [{ provide: TranslocoService, useValue: translocoSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(CarousalComponent);
    component = fixture.componentInstance;
    mockTranslocoService = TestBed.inject(
      TranslocoService,
    ) as jasmine.SpyObj<TranslocoService>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.slides()).toEqual([]);
      expect(component.isContentLoading()).toBe(false);
      expect(component.skeletonTemplate()).toBeNull();
      expect(component.currentIndex).toBe(0);
      expect(component.isAnimating).toBe(false);
      expect(component.isDragging).toBe(false);
      expect(component.dragOffset).toBe(0);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('slides', mockSlides);
      component.currentIndex = 1;
    });

    describe('nextSlide', () => {
      it('should move to next slide when conditions are met', () => {
        spyOn(component as any, 'startSkeletonAnimation');
        component.isAnimating = false;
        fixture.componentRef.setInput('isContentLoading', false);

        component.nextSlide();

        expect(component.slideDirection).toBe('right');
        expect((component as any).startSkeletonAnimation).toHaveBeenCalled();
      });

      it('should not move when at last slide', () => {
        component.currentIndex = mockSlides.length - 1;
        spyOn(component as any, 'startSkeletonAnimation');

        component.nextSlide();

        expect(
          (component as any).startSkeletonAnimation,
        ).not.toHaveBeenCalled();
      });

      it('should not move when animating', () => {
        component.isAnimating = true;
        spyOn(component as any, 'startSkeletonAnimation');

        component.nextSlide();

        expect(
          (component as any).startSkeletonAnimation,
        ).not.toHaveBeenCalled();
      });

      it('should not move when content is loading', () => {
        fixture.componentRef.setInput('isContentLoading', true);
        spyOn(component as any, 'startSkeletonAnimation');

        component.nextSlide();

        expect(
          (component as any).startSkeletonAnimation,
        ).not.toHaveBeenCalled();
      });
    });

    describe('previousSlide', () => {
      it('should move to previous slide when conditions are met', () => {
        spyOn(component as any, 'startSkeletonAnimation');
        component.isAnimating = false;
        fixture.componentRef.setInput('isContentLoading', false);

        component.previousSlide();

        expect(component.slideDirection).toBe('left');
        expect((component as any).startSkeletonAnimation).toHaveBeenCalled();
      });

      it('should not move when at first slide', () => {
        component.currentIndex = 0;
        spyOn(component as any, 'startSkeletonAnimation');

        component.previousSlide();

        expect(
          (component as any).startSkeletonAnimation,
        ).not.toHaveBeenCalled();
      });
    });
  });

  describe('Transform Methods', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('slides', mockSlides);
      component.currentIndex = 1;
      component.containerWidth = 400;
      component.dragOffset = 100;
    });

    it('should calculate header transform for LTR', () => {
      component.isRTL = false;
      const transform = component.getHeaderTransform();
      expect(transform).toContain('calc(-');
      expect(transform).toContain('% + -48px)');
    });

    it('should calculate header transform for RTL', () => {
      component.isRTL = true;
      const transform = component.getHeaderTransform();
      expect(transform).toContain('calc(');
      expect(transform).toContain('% + 48px)');
    });

    it('should calculate content transform', () => {
      const transform = component.getContentTransform();
      expect(transform).toBe('translateX(100px)');
    });

    it('should calculate skeleton transform when completing animation', () => {
      component.isCompletingAnimation = true;
      const transform = component.getSkeletonTransform();
      expect(transform).toBe('translateX(0%)');
    });

    it('should calculate skeleton transform for right direction', () => {
      component.skeletonDirection = 'right';
      component.isCompletingAnimation = false;
      const transform = component.getSkeletonTransform();
      expect(transform).toBe('translateX(100%)');
    });

    it('should calculate skeleton transform for left direction', () => {
      component.skeletonDirection = 'left';
      component.isCompletingAnimation = false;
      const transform = component.getSkeletonTransform();
      expect(transform).toBe('translateX(-100%)');
    });

    it('should calculate header transform at first slide', () => {
      component.currentIndex = 0;
      component.isRTL = false;
      const transform = component.getHeaderTransform();
      expect(transform).toContain('calc(');
      expect(transform).toContain('% + 0px)');
    });

    it('should calculate header transform at last slide', () => {
      component.currentIndex = 2;
      component.isRTL = false;
      const transform = component.getHeaderTransform();
      expect(transform).toContain('calc(-');
      expect(transform).toContain('%');
    });
  });

  describe('Touch Events', () => {
    let mockTouchEvent: jasmine.SpyObj<TouchEvent>;

    beforeEach(() => {
      mockTouchEvent = jasmine.createSpyObj('TouchEvent', ['preventDefault']);
      const mockTouch = { clientX: 100, clientY: 50 } as Touch;
      const mockTouchList = {
        0: mockTouch,
        length: 1,
        item: jasmine.createSpy('item').and.returnValue(mockTouch),
      } as unknown as TouchList;

      Object.defineProperty(mockTouchEvent, 'touches', {
        value: mockTouchList,
        writable: false,
        configurable: true,
      });
    });

    it('should start drag on touch start', () => {
      spyOn(component as any, 'startDrag');
      component.isAnimating = false;
      fixture.componentRef.setInput('isContentLoading', false);

      component.onTouchStart(mockTouchEvent);

      expect((component as any).startDrag).toHaveBeenCalledWith(100, 50);
    });

    it('should not start drag when animating', () => {
      spyOn(component as any, 'startDrag');
      component.isAnimating = true;

      component.onTouchStart(mockTouchEvent);

      expect((component as any).startDrag).not.toHaveBeenCalled();
    });

    it('should not start drag with multiple touches', () => {
      const multiTouchEvent = jasmine.createSpyObj('TouchEvent', [
        'preventDefault',
      ]);

      const mockTouch1 = { clientX: 100, clientY: 50 } as Touch;
      const mockTouch2 = { clientX: 200, clientY: 100 } as Touch;
      const mockTouchList = {
        0: mockTouch1,
        1: mockTouch2,
        length: 2,
        item: jasmine
          .createSpy('item')
          .and.callFake((index: number) =>
            index === 0 ? mockTouch1 : mockTouch2,
          ),
      } as unknown as TouchList;

      Object.defineProperty(multiTouchEvent, 'touches', {
        value: mockTouchList,
        writable: false,
      });

      spyOn(component as any, 'startDrag');
      component.isAnimating = false;
      fixture.componentRef.setInput('isContentLoading', false);

      component.onTouchStart(multiTouchEvent);

      expect((component as any).startDrag).not.toHaveBeenCalled();
    });

    it('should update drag on touch move', () => {
      spyOn(component as any, 'updateDrag');
      component.isDragging = true;

      component.onTouchMove(mockTouchEvent);

      expect((component as any).updateDrag).toHaveBeenCalledWith(100, 50);
    });

    it('should not update drag when not dragging', () => {
      spyOn(component as any, 'updateDrag');
      component.isDragging = false;

      component.onTouchMove(mockTouchEvent);

      expect((component as any).updateDrag).not.toHaveBeenCalled();
    });

    it('should not update drag with multiple touches', () => {
      const multiTouchEvent = jasmine.createSpyObj('TouchEvent', [
        'preventDefault',
      ]);

      const mockTouch1 = { clientX: 100, clientY: 50 } as Touch;
      const mockTouch2 = { clientX: 200, clientY: 100 } as Touch;
      const mockTouchList = {
        0: mockTouch1,
        1: mockTouch2,
        length: 2,
        item: jasmine
          .createSpy('item')
          .and.callFake((index: number) =>
            index === 0 ? mockTouch1 : mockTouch2,
          ),
      } as unknown as TouchList;

      Object.defineProperty(multiTouchEvent, 'touches', {
        value: mockTouchList,
        writable: false,
      });

      spyOn(component as any, 'updateDrag');
      component.isDragging = true;

      component.onTouchMove(multiTouchEvent);

      expect((component as any).updateDrag).not.toHaveBeenCalled();
    });

    it('should prevent default when dragging distance exceeds threshold', () => {
      component.isDragging = true;
      component.dragOffset = 15;

      component.onTouchMove(mockTouchEvent);

      expect(mockTouchEvent.preventDefault).toHaveBeenCalled();
    });

    it('should end drag on touch end', () => {
      spyOn(component as any, 'endDrag');
      component.isDragging = true;

      component.onTouchEnd(mockTouchEvent);

      expect((component as any).endDrag).toHaveBeenCalled();
    });

    it('should not end drag when not dragging', () => {
      spyOn(component as any, 'endDrag');
      component.isDragging = false;

      component.onTouchEnd(mockTouchEvent);

      expect((component as any).endDrag).not.toHaveBeenCalled();
    });
  });

  describe('Mouse Events', () => {
    let mockMouseEvent: jasmine.SpyObj<MouseEvent>;

    beforeEach(() => {
      mockMouseEvent = jasmine.createSpyObj('MouseEvent', ['preventDefault']);
      Object.defineProperty(mockMouseEvent, 'clientX', {
        value: 100,
        writable: false,
      });
      Object.defineProperty(mockMouseEvent, 'clientY', {
        value: 50,
        writable: false,
      });
    });

    it('should start drag on mouse down', () => {
      spyOn(component as any, 'startDrag');
      component.isAnimating = false;
      fixture.componentRef.setInput('isContentLoading', false);

      component.onMouseDown(mockMouseEvent);

      expect((component as any).startDrag).toHaveBeenCalledWith(100, 50);
      expect(mockMouseEvent.preventDefault).toHaveBeenCalled();
    });

    it('should not start drag when animating', () => {
      spyOn(component as any, 'startDrag');
      component.isAnimating = true;

      component.onMouseDown(mockMouseEvent);

      expect((component as any).startDrag).not.toHaveBeenCalled();
    });

    it('should not start drag when content is loading', () => {
      spyOn(component as any, 'startDrag');
      fixture.componentRef.setInput('isContentLoading', true);

      component.onMouseDown(mockMouseEvent);

      expect((component as any).startDrag).not.toHaveBeenCalled();
    });

    it('should update drag on mouse move', () => {
      spyOn(component as any, 'updateDrag');
      component.isDragging = true;

      component.onMouseMove(mockMouseEvent);

      expect((component as any).updateDrag).toHaveBeenCalledWith(100, 50);
    });

    it('should not update drag when not dragging', () => {
      spyOn(component as any, 'updateDrag');
      component.isDragging = false;

      component.onMouseMove(mockMouseEvent);

      expect((component as any).updateDrag).not.toHaveBeenCalled();
    });

    it('should end drag on mouse up', () => {
      spyOn(component as any, 'endDrag');
      component.isDragging = true;

      component.onMouseUp(mockMouseEvent);

      expect((component as any).endDrag).toHaveBeenCalled();
    });

    it('should not end drag when not dragging', () => {
      spyOn(component as any, 'endDrag');
      component.isDragging = false;

      component.onMouseUp(mockMouseEvent);

      expect((component as any).endDrag).not.toHaveBeenCalled();
    });

    it('should end drag on mouse leave', () => {
      spyOn(component as any, 'endDrag');
      component.isDragging = true;

      component.onMouseLeave(mockMouseEvent);

      expect((component as any).endDrag).toHaveBeenCalled();
    });

    it('should not end drag on mouse leave when not dragging', () => {
      spyOn(component as any, 'endDrag');
      component.isDragging = false;

      component.onMouseLeave(mockMouseEvent);

      expect((component as any).endDrag).not.toHaveBeenCalled();
    });
  });

  describe('Skeleton Display Logic', () => {
    it('should show skeleton when overlay is visible', () => {
      component.showSkeletonOverlay = true;
      expect(component.shouldShowSkeleton()).toBe(true);
    });

    it('should show skeleton when dragging with template', () => {
      component.isDragging = true;
      component.hasMoved = true;
      fixture.componentRef.setInput('skeletonTemplate', {} as TemplateRef<any>);
      expect(component.shouldShowSkeleton()).toBe(true);
    });

    it('should not show skeleton when dragging without template', () => {
      component.isDragging = true;
      component.hasMoved = true;
      fixture.componentRef.setInput('skeletonTemplate', null);
      expect(component.shouldShowSkeleton()).toBe(false);
    });
  });

  describe('Private Methods', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('slides', mockSlides);
      // Mock the viewChild elements
      const mockContentElement = {
        offsetWidth: 400,
        style: { transition: '' },
      };
      const mockHeaderElement = {
        style: { transition: '' },
      };

      // Mock the actual component methods that access these elements
      spyOn(component, 'contentContainer').and.returnValue({
        nativeElement: mockContentElement,
      } as ElementRef);

      spyOn(component, 'headerContainer').and.returnValue({
        nativeElement: mockHeaderElement,
      } as ElementRef);
    });

    it('should emit slide change', () => {
      spyOn(component.slideChange, 'emit');
      component.currentIndex = 1;

      (component as any).emitSlideChange();

      expect(component.slideChange.emit).toHaveBeenCalledWith('2');
    });

    it('should set transition styles', () => {
      const mockContentElement = component.contentContainer()?.nativeElement;
      const mockHeaderElement = component.headerContainer()?.nativeElement;

      (component as any).setTransition(true);

      expect(mockContentElement?.style.transition).toContain(
        'transform 300ms cubic-bezier',
      );
      expect(mockHeaderElement?.style.transition).toContain(
        'transform 300ms cubic-bezier',
      );
    });

    it('should remove transition styles', () => {
      const mockContentElement = component.contentContainer()?.nativeElement;
      const mockHeaderElement = component.headerContainer()?.nativeElement;

      (component as any).setTransition(false);

      expect(mockContentElement?.style.transition).toBe('none');
      expect(mockHeaderElement?.style.transition).toBe('none');
    });

    it('should start drag with correct initial values', () => {
      (component as any).startDrag(100, 50);

      expect(component.isDragging).toBe(true);
      expect((component as any).startX).toBe(100);
      expect((component as any).startY).toBe(50);
      expect(component.hasMoved).toBe(false);
      expect(component.dragOffset).toBe(0);
    });

    it('should update drag offset correctly', () => {
      (component as any).startX = 100;
      (component as any).startY = 50;
      component.isDragging = true;

      (component as any).updateDrag(150, 60);

      expect((component as any).currentX).toBe(150);
      expect((component as any).currentY).toBe(60);
    });
  });

  describe('Animation States', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('slides', mockSlides);
      const mockContentElement = {
        offsetWidth: 400,
        style: { transition: '' },
      };
      const mockHeaderElement = {
        style: { transition: '' },
      };

      spyOn(component, 'contentContainer').and.returnValue({
        nativeElement: mockContentElement,
      } as ElementRef);

      spyOn(component, 'headerContainer').and.returnValue({
        nativeElement: mockHeaderElement,
      } as ElementRef);
    });

    it('should complete animation correctly', () => {
      component.dragOffset = 100;
      component.showSkeletonOverlay = true;
      component.isCompletingAnimation = true;
      component.isAnimating = true;

      (component as any).completeAnimation();

      expect(component.dragOffset).toBe(0);
      expect(component.showSkeletonOverlay).toBe(false);
      expect(component.isCompletingAnimation).toBe(false);
    });

    it('should snap back correctly', () => {
      spyOn(component as any, 'setTransition');
      component.dragOffset = 100;
      component.showSkeletonOverlay = true;

      (component as any).snapBack();

      expect(component.dragOffset).toBe(0);
      expect(component.showSkeletonOverlay).toBe(false);
      expect((component as any).setTransition).toHaveBeenCalledWith(true);
    });

    it('should start skeleton animation without template', () => {
      spyOn(component as any, 'animateSlideChange');
      fixture.componentRef.setInput('skeletonTemplate', null);

      (component as any).startSkeletonAnimation(() => {});

      expect((component as any).animateSlideChange).toHaveBeenCalled();
    });

    it('should animate slide change without skeleton', fakeAsync(() => {
      const callback = jasmine.createSpy('callback');
      spyOn(component as any, 'setTransition');

      (component as any).animateSlideChange(callback);

      expect(component.isAnimating).toBe(true);
      expect(callback).toHaveBeenCalled();

      tick(300);

      expect(component.isAnimating).toBe(false);
    }));
  });

  describe('RTL Support', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('slides', mockSlides);
      component.containerWidth = 400;
    });

    it('should handle RTL skeleton direction correctly', () => {
      component.isRTL = true;
      component.slideDirection = 'right';

      component.nextSlide();

      expect(component.skeletonDirection).toBe('left');
    });

    it('should handle LTR skeleton direction correctly', () => {
      component.isRTL = false;
      component.slideDirection = 'right';

      component.nextSlide();

      expect(component.skeletonDirection).toBe('right');
    });
  });

  describe('Drag Interactions', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('slides', mockSlides);
      const mockContentElement = {
        offsetWidth: 400,
        style: { transition: '' },
      };
      const mockHeaderElement = {
        style: { transition: '' },
      };

      spyOn(component, 'contentContainer').and.returnValue({
        nativeElement: mockContentElement,
      } as ElementRef);

      spyOn(component, 'headerContainer').and.returnValue({
        nativeElement: mockHeaderElement,
      } as ElementRef);
    });

    it('should handle horizontal swipe correctly', () => {
      (component as any).startX = 100;
      (component as any).startY = 100;
      component.isDragging = true;
      component.currentIndex = 1;

      (component as any).updateDrag(150, 105);

      expect(component.hasMoved).toBe(true);
      expect(component.dragOffset).toBe(50);
    });

    it('should handle vertical swipe and ignore horizontal movement', () => {
      (component as any).startX = 100;
      (component as any).startY = 100;
      component.isDragging = true;

      (component as any).updateDrag(105, 150);

      expect(component.hasMoved).toBe(false);
      expect(component.dragOffset).toBe(0);
    });

    it('should apply resistance at first slide', () => {
      component.currentIndex = 0;
      component.isRTL = false;
      (component as any).startX = 100;
      (component as any).startY = 100;
      component.isDragging = true;

      (component as any).updateDrag(150, 105);

      expect(component.dragOffset).toBe(15);
    });

    it('should apply resistance at last slide', () => {
      component.currentIndex = 2;
      component.isRTL = false;
      (component as any).startX = 100;
      (component as any).startY = 100;
      component.isDragging = true;

      (component as any).updateDrag(50, 105);

      expect(component.dragOffset).toBe(-15);
    });

    it('should handle RTL resistance at first slide', () => {
      component.currentIndex = 0;
      component.isRTL = true;
      (component as any).startX = 100;
      (component as any).startY = 100;
      component.isDragging = true;

      (component as any).updateDrag(50, 105);

      expect(component.dragOffset).toBe(-15);
    });

    it('should handle RTL resistance at last slide', () => {
      component.currentIndex = 2;
      component.isRTL = true;
      (component as any).startX = 100;
      (component as any).startY = 100;
      component.isDragging = true;

      (component as any).updateDrag(150, 105);

      expect(component.dragOffset).toBe(15);
    });
  });

  describe('Swipe Completion Logic', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('slides', mockSlides);
      const mockContentElement = {
        offsetWidth: 400,
        style: { transition: '' },
      };
      const mockHeaderElement = {
        style: { transition: '' },
      };

      spyOn(component, 'contentContainer').and.returnValue({
        nativeElement: mockContentElement,
      } as ElementRef);

      spyOn(component, 'headerContainer').and.returnValue({
        nativeElement: mockHeaderElement,
      } as ElementRef);

      component.containerWidth = 400;
    });

    it('should complete swipe to next slide in LTR', () => {
      spyOn(component as any, 'startCompletionFromDrag');
      spyOn(component as any, 'emitSlideChange');
      component.currentIndex = 1;
      component.isRTL = false;
      component.isDragging = true;
      component.hasMoved = true;
      (component as any).startX = 200;
      (component as any).currentX = 50;

      (component as any).endDrag();

      expect((component as any).startCompletionFromDrag).toHaveBeenCalled();
    });

    it('should complete swipe to previous slide in LTR', () => {
      spyOn(component as any, 'startCompletionFromDrag');
      component.currentIndex = 1;
      component.isRTL = false;
      component.isDragging = true;
      component.hasMoved = true;
      (component as any).startX = 50;
      (component as any).currentX = 200;

      (component as any).endDrag();

      expect((component as any).startCompletionFromDrag).toHaveBeenCalled();
    });

    it('should complete swipe to next slide in RTL', () => {
      spyOn(component as any, 'startCompletionFromDrag');
      component.currentIndex = 1;
      component.isRTL = true;
      component.isDragging = true;
      component.hasMoved = true;
      (component as any).startX = 50;
      (component as any).currentX = 200;

      (component as any).endDrag();

      expect((component as any).startCompletionFromDrag).toHaveBeenCalled();
    });

    it('should complete swipe to previous slide in RTL', () => {
      spyOn(component as any, 'startCompletionFromDrag');
      component.currentIndex = 1;
      component.isRTL = true;
      component.isDragging = true;
      component.hasMoved = true;
      (component as any).startX = 200;
      (component as any).currentX = 50;

      (component as any).endDrag();

      expect((component as any).startCompletionFromDrag).toHaveBeenCalled();
    });

    it('should snap back when swipe distance is insufficient', () => {
      spyOn(component as any, 'snapBack');
      component.currentIndex = 1;
      component.isDragging = true;
      component.hasMoved = true;
      (component as any).startX = 100;
      (component as any).currentX = 120;

      (component as any).endDrag();

      expect((component as any).snapBack).toHaveBeenCalled();
    });

    it('should snap back when at boundary and swiping wrong direction', () => {
      spyOn(component as any, 'snapBack');
      component.currentIndex = 0;
      component.isRTL = false;
      component.isDragging = true;
      component.hasMoved = true;
      (component as any).startX = 50;
      (component as any).currentX = 200;

      (component as any).endDrag();

      expect((component as any).snapBack).toHaveBeenCalled();
    });

    it('should start completion from drag with correct animation', fakeAsync(() => {
      spyOn(component as any, 'completeAnimation');
      const callback = jasmine.createSpy('callback');
      component.slideDirection = 'right';
      component.isRTL = false;
      component.containerWidth = 400;

      (component as any).startCompletionFromDrag(callback);

      expect(component.isAnimating).toBe(true);
      expect(component.isCompletingAnimation).toBe(true);
      expect(component.dragOffset).toBe(-400);

      tick(300);

      expect(callback).toHaveBeenCalled();
      expect((component as any).completeAnimation).toHaveBeenCalled();
    }));
  });

  describe('Edge Cases', () => {
    it('should handle missing contentContainer gracefully', () => {
      spyOn(component, 'contentContainer').and.returnValue(undefined);

      expect(() => {
        (component as any).startDrag(100, 50);
      }).not.toThrow();
    });

    it('should handle missing headerContainer gracefully', () => {
      spyOn(component, 'headerContainer').and.returnValue(undefined);

      expect(() => {
        (component as any).setTransition(true);
      }).not.toThrow();
    });

    it('should handle zero container width', () => {
      component.containerWidth = 0;
      const transform = component.getHeaderTransform();

      expect(transform).toContain('calc(');
    });

    it('should not emit slide change when no slides exist', () => {
      spyOn(component.slideChange, 'emit');
      fixture.componentRef.setInput('slides', []);
      component.currentIndex = 0;

      (component as any).emitSlideChange();

      expect(component.slideChange.emit).not.toHaveBeenCalled();
    });

    it('should handle endDrag when not dragging', () => {
      component.isDragging = false;

      expect(() => {
        (component as any).endDrag();
      }).not.toThrow();
    });

    it('should handle updateDrag when not dragging', () => {
      component.isDragging = false;

      expect(() => {
        (component as any).updateDrag(100, 50);
      }).not.toThrow();
    });
  });

  describe('Skeleton Animation Details', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('slides', mockSlides);
      fixture.componentRef.setInput('skeletonTemplate', {} as TemplateRef<any>);
      component.containerWidth = 400;
    });

    it('should calculate skeleton transform when dragging right', () => {
      component.isDragging = true;
      component.hasMoved = true;
      component.dragOffset = 100;

      const transform = component.getSkeletonTransform();

      expect(transform).toContain('translateX(');
      expect(transform).toContain('%');
    });

    it('should calculate skeleton transform when dragging left', () => {
      component.isDragging = true;
      component.hasMoved = true;
      component.dragOffset = -100;

      const transform = component.getSkeletonTransform();

      expect(transform).toContain('translateX(');
      expect(transform).toContain('%');
    });

    it('should set skeleton overlay during drag start', () => {
      fixture.componentRef.setInput('skeletonTemplate', {} as TemplateRef<any>);

      (component as any).startDrag(100, 50);

      expect(component.showSkeletonOverlay).toBe(false);
    });

    it('should show skeleton overlay when movement starts', () => {
      fixture.componentRef.setInput('skeletonTemplate', {} as TemplateRef<any>);
      component.isDragging = true;
      (component as any).startX = 100;
      (component as any).startY = 100;

      (component as any).updateDrag(150, 105);

      expect(component.showSkeletonOverlay).toBe(true);
    });
  });

  describe('Header Transform Complex Cases', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('slides', mockSlides);
      component.containerWidth = 400;
    });

    it('should calculate header transform during animation', () => {
      component.currentIndex = 1;
      component.isAnimating = true;
      component.dragOffset = -200;
      component.slideDirection = 'right';
      component.isRTL = false;

      const transform = component.getHeaderTransform();

      expect(transform).toContain('calc(');
      expect(transform).toContain('%');
      expect(transform).toContain('px');
    });

    it('should calculate header transform during RTL animation', () => {
      component.currentIndex = 1;
      component.isAnimating = true;
      component.dragOffset = 200;
      component.slideDirection = 'left';
      component.isRTL = true;

      const transform = component.getHeaderTransform();

      expect(transform).toContain('calc(');
      expect(transform).toContain('%');
      expect(transform).toContain('px');
    });

    it('should handle previous slide direction in animation', () => {
      component.currentIndex = 1;
      component.isAnimating = true;
      component.dragOffset = 200;
      component.slideDirection = 'left';
      component.isRTL = false;

      const transform = component.getHeaderTransform();

      expect(transform).toContain('calc(');
    });
  });
});
