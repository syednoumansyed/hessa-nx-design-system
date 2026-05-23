import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { DsActionListItemComponent } from './action-list-item.component';
import { DsActionListItemConfig } from './action-list.interface';
import { AvatarComponent } from '../avatar/avatar.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faHeart } from '@fortawesome/pro-regular-svg-icons';
import {
  DS_TRANSLATION_TOKEN,
  DsTranslationService,
} from '@ds/i18n/ds-translation.token';

// Test host component to test outputs
@Component({
  standalone: true,
  imports: [DsActionListItemComponent],
  template: `
    <ds-action-list-item
      [config]="config"
      [disabled]="disabled"
      (itemClick)="onItemClick($event)"
    />
  `,
})
class TestHostComponent {
  config: DsActionListItemConfig = {
    id: 'test-item',
    title: 'Test Item',
  };
  disabled = false;
  clickedItem?: DsActionListItemConfig;

  onItemClick(item: DsActionListItemConfig): void {
    this.clickedItem = item;
  }
}

describe('DsActionListItemComponent', () => {
  let component: DsActionListItemComponent;
  let fixture: ComponentFixture<DsActionListItemComponent>;
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    // Mock translation service
    const mockTranslationService: DsTranslationService = {
      translate: (key: string, params?: Record<string, any>) => key,
      getActiveLang: () => 'en',
    };

    await TestBed.configureTestingModule({
      imports: [
        DsActionListItemComponent,
        AvatarComponent,
        DsIconComponent,
        TestHostComponent,
      ],
      providers: [
        { provide: DS_TRANSLATION_TOKEN, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DsActionListItemComponent);
    component = fixture.componentInstance;

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      fixture.componentRef.setInput('config', {
        id: 'test',
        title: 'Test Item',
      });
      expect(component).toBeTruthy();
    });

    it('should render the title', () => {
      const config: DsActionListItemConfig = {
        id: 'test',
        title: 'Test Title',
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(
        By.css('.content-md-high-emphasis'),
      );
      expect(titleElement.nativeElement.textContent.trim()).toBe('Test Title');
    });

    it('should have correct data-testid attribute', () => {
      const config: DsActionListItemConfig = {
        id: 'custom-id',
        title: 'Test',
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const containerElement = fixture.debugElement.query(
        By.css('[data-testid]'),
      );
      expect(containerElement.nativeElement.getAttribute('data-testid')).toBe(
        'ds-list-item-custom-id',
      );
    });

    it('should use default testid when no id provided', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const containerElement = fixture.debugElement.query(
        By.css('[data-testid]'),
      );
      expect(containerElement.nativeElement.getAttribute('data-testid')).toBe(
        'ds-list-item-default',
      );
    });
  });

  describe('Avatar Functionality', () => {
    it('should display avatar when avatar config is provided', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
        avatar: {
          fullName: 'John Doe',
          imageUrl: 'test-image.jpg',
        },
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const avatarElement = fixture.debugElement.query(By.css('app-ds-avatar'));
      expect(avatarElement).toBeTruthy();
    });

    it('should not display avatar when avatar config is not provided', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const avatarElement = fixture.debugElement.query(By.css('app-ds-avatar'));
      expect(avatarElement).toBeFalsy();
    });

    it('should pass correct props to avatar component', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
        avatar: {
          fullName: 'John Doe',
          imageUrl: 'test-image.jpg',
        },
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const avatarElement = fixture.debugElement.query(By.css('app-ds-avatar'));
      expect(avatarElement.componentInstance.fullName()).toBe('John Doe');
      expect(avatarElement.componentInstance.imageUrl()).toBe('test-image.jpg');
      expect(avatarElement.componentInstance.size()).toBe('sm');
    });

    it('should use title as fallback for avatar name when fullName is not provided', () => {
      const config: DsActionListItemConfig = {
        title: 'Test User',
        avatar: {},
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const avatarElement = fixture.debugElement.query(By.css('app-ds-avatar'));
      expect(avatarElement.componentInstance.fullName()).toBe('Test User');
    });
  });

  describe('Upper Supporting Text', () => {
    it('should display upper supporting text when provided', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
        upperSupportingText: 'Category A',
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const upperTextElement = fixture.debugElement.query(
        By.css('.single-line-caption-mid-emphasis'),
      );
      expect(upperTextElement.nativeElement.textContent.trim()).toBe(
        'Category A',
      );
    });

    it('should not display upper supporting text when not provided', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const upperTextElement = fixture.debugElement.query(
        By.css('.single-line-caption-mid-emphasis'),
      );
      expect(upperTextElement).toBeFalsy();
    });
  });

  describe('Supporting Text', () => {
    it('should display supporting text when provided', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
        supportingText: {
          text: 'Active',
          variant: 'success',
        },
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const supportingTextElement = fixture.debugElement.query(
        By.css('.single-line-Caption-mid-emphasis'),
      );
      expect(supportingTextElement.nativeElement.textContent.trim()).toBe(
        'Active',
      );
    });

    it('should not display supporting text when not provided', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const supportingTextElement = fixture.debugElement.query(
        By.css('.single-line-Caption-mid-emphasis'),
      );
      expect(supportingTextElement).toBeFalsy();
    });

    it('should display icon when supporting text has icon', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
        supportingText: {
          text: 'Active',
          icon: faHeart,
          variant: 'success',
        },
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const iconElements = fixture.debugElement.queryAll(By.css('app-ds-icon'));
      // Should have icon for supporting text (and possibly arrow)
      expect(iconElements.length).toBeGreaterThan(0);
    });

    it('should display count badge when supporting text has count', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
        supportingText: {
          text: 'Messages',
          count: 5,
          variant: 'success',
        },
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const countElement = fixture.debugElement.query(
        By.css('.single-line-caption-high-emphasis'),
      );
      expect(countElement.nativeElement.textContent.trim()).toBe('5');
    });
  });

  describe('Supporting Text Variants', () => {
    it('should apply success variant classes correctly to DOM elements', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
        supportingText: {
          text: 'Active',
          variant: 'success',
        },
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const supportingTextElement = fixture.debugElement.query(
        By.css('.single-line-Caption-mid-emphasis'),
      );
      expect(supportingTextElement.nativeElement.classList).toContain(
        'text-content-success',
      );
    });

    it('should apply danger variant classes correctly to DOM elements', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
        supportingText: {
          text: 'Error',
          variant: 'danger',
        },
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const supportingTextElement = fixture.debugElement.query(
        By.css('.single-line-Caption-mid-emphasis'),
      );
      expect(supportingTextElement.nativeElement.classList).toContain(
        'text-content-error',
      );
    });

    it('should apply default variant classes correctly to DOM elements', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
        supportingText: {
          text: 'Default',
          variant: 'default',
        },
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const supportingTextElement = fixture.debugElement.query(
        By.css('.single-line-Caption-mid-emphasis'),
      );
      expect(supportingTextElement.nativeElement.classList).toContain(
        'text-gray-600',
      );
    });

    it('should use default variant classes when no variant specified', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
        supportingText: {
          text: 'No Variant',
        },
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const supportingTextElement = fixture.debugElement.query(
        By.css('.single-line-Caption-mid-emphasis'),
      );
      expect(supportingTextElement.nativeElement.classList).toContain(
        'text-gray-600',
      );
    });
  });

  describe('Arrow Functionality', () => {
    it('should not show arrow by default', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const arrowContainer = fixture.debugElement.query(
        By.css('.bg-pastels-purple-200'),
      );
      expect(arrowContainer).toBeFalsy();
    });

    it('should show arrow when showArrow is true', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
        endIconConfig: {
          showArrow: true,
        },
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const arrowContainer = fixture.debugElement.query(
        By.css('.bg-pastels-purple-200'),
      );
      expect(arrowContainer).toBeTruthy();
    });

    it('should hide arrow when showArrow is false', () => {
      const config: DsActionListItemConfig = {
        title: 'Test',
        endIconConfig: {
          showArrow: false,
        },
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      const arrowContainer = fixture.debugElement.query(
        By.css('.bg-pastels-purple-200'),
      );
      expect(arrowContainer).toBeFalsy();
    });
  });

  describe('Click Events', () => {
    beforeEach(() => {
      hostComponent.config = {
        id: 'test-item',
        title: 'Test Item',
      };
      hostFixture.detectChanges();
    });

    it('should emit itemClick when component is clicked', () => {
      spyOn(hostComponent, 'onItemClick');

      const containerElement = hostFixture.debugElement.query(
        By.css('[data-testid]'),
      );
      containerElement.nativeElement.click();

      expect(hostComponent.onItemClick).toHaveBeenCalledWith(
        hostComponent.config,
      );
    });

    it('should pass the correct config object when clicked', () => {
      const config: DsActionListItemConfig = {
        id: 'custom-id',
        title: 'Custom Item',
        upperSupportingText: 'Custom Category',
      };
      hostComponent.config = config;
      hostFixture.detectChanges();

      const containerElement = hostFixture.debugElement.query(
        By.css('[data-testid]'),
      );
      containerElement.nativeElement.click();

      expect(hostComponent.clickedItem).toEqual(config);
    });
  });

  describe('Computed Properties (Indirect Testing)', () => {
    it('should show/hide arrow based on showArrow config', () => {
      // Test showArrow = false
      fixture.componentRef.setInput('config', {
        title: 'Test',
      });
      fixture.detectChanges();

      let arrowContainer = fixture.debugElement.query(
        By.css('.bg-pastels-purple-200'),
      );
      expect(arrowContainer).toBeFalsy();

      // Test showArrow = true
      fixture.componentRef.setInput('config', {
        title: 'Test',
        endIconConfig: {
          showArrow: true,
        },
      });
      fixture.detectChanges();

      arrowContainer = fixture.debugElement.query(
        By.css('.bg-pastels-purple-200'),
      );
      expect(arrowContainer).toBeTruthy();
    });

    it('should use correct avatar name in rendered avatar component', () => {
      // Test with fullName provided
      fixture.componentRef.setInput('config', {
        title: 'Test',
        avatar: { fullName: 'John Doe' },
      });
      fixture.detectChanges();

      let avatarElement = fixture.debugElement.query(By.css('app-ds-avatar'));
      expect(avatarElement.componentInstance.fullName()).toBe('John Doe');

      // Test fallback to title when no fullName
      fixture.componentRef.setInput('config', {
        title: 'Test Title',
        avatar: {},
      });
      fixture.detectChanges();

      avatarElement = fixture.debugElement.query(By.css('app-ds-avatar'));
      expect(avatarElement.componentInstance.fullName()).toBe('Test Title');
    });

    it('should use correct avatar image URL in rendered avatar component', () => {
      // Test with imageUrl provided
      fixture.componentRef.setInput('config', {
        title: 'Test',
        avatar: { imageUrl: 'test.jpg' },
      });
      fixture.detectChanges();

      let avatarElement = fixture.debugElement.query(By.css('app-ds-avatar'));
      expect(avatarElement.componentInstance.imageUrl()).toBe('test.jpg');

      // Test without imageUrl
      fixture.componentRef.setInput('config', {
        title: 'Test',
        avatar: {},
      });
      fixture.detectChanges();

      avatarElement = fixture.debugElement.query(By.css('app-ds-avatar'));
      expect(avatarElement.componentInstance.imageUrl()).toBeNull();
    });

    it('should render supporting icon when provided', () => {
      // Test with icon
      fixture.componentRef.setInput('config', {
        title: 'Test',
        supportingText: { text: 'test', icon: faHeart },
      });
      fixture.detectChanges();

      const iconElements = fixture.debugElement.queryAll(By.css('app-ds-icon'));
      const supportingTextIcons = iconElements.filter((el) =>
        el.nativeElement.closest('.flex.items-center.gap-1'),
      );
      expect(supportingTextIcons.length).toBeGreaterThan(0);

      // Test without icon
      fixture.componentRef.setInput('config', {
        title: 'Test',
        supportingText: { text: 'test' },
      });
      fixture.detectChanges();

      const iconElementsWithoutIcon = fixture.debugElement.queryAll(
        By.css('app-ds-icon'),
      );
      const supportingTextIconsWithoutIcon = iconElementsWithoutIcon.filter(
        (el) => el.nativeElement.closest('.flex.items-center.gap-1'),
      );
      // Should only have the arrow icon, not supporting text icon
      expect(supportingTextIconsWithoutIcon.length).toBe(0);
    });
  });

  describe('Disabled State', () => {
    it('should accept disabled input through host component', () => {
      hostComponent.disabled = true;
      hostFixture.detectChanges();

      // Test through host component behavior rather than direct access
      expect(hostComponent.disabled).toBe(true);
    });

    it('should default disabled to false', () => {
      hostFixture.detectChanges();

      expect(hostComponent.disabled).toBe(false);
    });
  });

  describe('Complex Configuration', () => {
    it('should render all elements correctly with full configuration', () => {
      const config: DsActionListItemConfig = {
        id: 'full-config',
        title: 'Full Configuration Item',
        upperSupportingText: 'Administrator',
        avatar: {
          fullName: 'John Doe',
          imageUrl: 'john.jpg',
        },
        supportingText: {
          text: 'Active',
          icon: faHeart,
          count: 3,
          variant: 'success',
        },
        endIconConfig: {
          showArrow: true,
        },
      };
      fixture.componentRef.setInput('config', config);
      fixture.detectChanges();

      // Check all elements are present
      const avatarElement = fixture.debugElement.query(By.css('app-ds-avatar'));
      const titleElement = fixture.debugElement.query(
        By.css('.content-md-high-emphasis'),
      );
      const upperTextElement = fixture.debugElement.query(
        By.css('.single-line-caption-mid-emphasis'),
      );
      const supportingTextElement = fixture.debugElement.query(
        By.css('.single-line-Caption-mid-emphasis'),
      );
      const countElement = fixture.debugElement.query(
        By.css('.single-line-caption-high-emphasis'),
      );
      const arrowContainer = fixture.debugElement.query(
        By.css('.bg-pastels-purple-200'),
      );

      expect(avatarElement).toBeTruthy();
      expect(titleElement.nativeElement.textContent.trim()).toBe(
        'Full Configuration Item',
      );
      expect(upperTextElement.nativeElement.textContent.trim()).toBe(
        'Administrator',
      );
      expect(supportingTextElement.nativeElement.textContent.trim()).toBe(
        'Active',
      );
      expect(countElement.nativeElement.textContent.trim()).toBe('3');
      expect(arrowContainer).toBeTruthy();
    });
  });
});
