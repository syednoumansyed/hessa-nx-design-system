// icon.component.ts
import {
  Component,
  booleanAttribute,
  input,
  computed,
  inject,
} from '@angular/core';
import { IconType, NgIcon } from '@ng-icons/core';
import {
  FaIconLibrary,
  FaIconComponent,
} from '@fortawesome/angular-fontawesome';
import { IconDefinition, SizeProp } from '@fortawesome/fontawesome-svg-core';
import { IonIcon } from '@ionic/angular/standalone';

export type DsIcon = IconDefinition | IconType;
export type DsIconSize = SizeProp | number | string;

/**
 * @ai-hint
 * component: DsIconComponent
 * selector: app-ds-icon
 * intent: Unified icon renderer that auto-detects and renders FontAwesome IconDefinition objects, ng-icons string names, or SVG asset paths via a single icon input
 * do: Import FontAwesome icons from @fortawesome/pro-*-svg-icons and pass the IconDefinition directly; use size with FA keyword strings (xs, sm, lg, xl, 2xl) or pixel numbers/strings for custom sizes; pass cssClass to apply Tailwind color/margin utilities
 * dont: Don't pass a raw string icon name expecting FA rendering — string inputs are treated as SVG asset paths or ng-icon names; don't override font-size via inline style when using the size input
 * device: No structural device differences
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Component itself is direction-neutral; consuming components are responsible for mirroring directional icons (e.g. chevrons) when RTL is active
 * alternatives: IonIcon directly for Ionic-specific icons; NgIcon for ng-icons-only usage without FA overhead
 */
@Component({
  selector: 'app-ds-icon',
  standalone: true,
  imports: [NgIcon, FaIconComponent, IonIcon],
  template: `
    @if (isSvgAsset()) {
      <ion-icon
        [src]="svgSrc()"
        [class]="cssClass()"
        [style.font-size]="ngIconSize()"
      ></ion-icon>
    } @else if (isFontAwesome()) {
      <fa-icon
        [icon]="faIcon()"
        [class]="cssClass()"
        [size]="faSize()"
        [style.font-size]="customFaSize()"
      />
    } @else if (icon()) {
      <ng-icon [name]="ngIcon()" [class]="cssClass()" [size]="ngIconSize()" />
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
    fa-icon {
      display: inline-block;
      line-height: 0;
    }
    ng-icon {
      display: inline-block;
      line-height: 0;
      height: fit-content;
    }
    ion-icon {
      display: inline-block;
      line-height: 0;
    }
  `,
})
export class DsIconComponent {
  private readonly faIconLibrary = inject(FaIconLibrary);

  // Inputs
  icon = input<DsIcon>();
  cssClass = input<string>();
  fixedWidth = input<boolean, boolean | string>(false, {
    transform: booleanAttribute,
  });
  size = input<DsIconSize>('lg');

  // Font Awesome size handling
  protected faSize = computed<SizeProp | undefined>(() => {
    const size = this.size();
    return typeof size === 'string' && this.isFaSizeKeyword(size)
      ? (size as SizeProp)
      : undefined;
  });

  protected customFaSize = computed<string | undefined>(() => {
    const size = this.size();
    if (typeof size === 'number') return `${size}px`;
    if (typeof size === 'string' && !this.isFaSizeKeyword(size)) return size;
    return undefined;
  });

  // ng-icon size handling
  protected ngIconSize = computed<string>(() => {
    const size = this.size();
    if (typeof size === 'string' && this.sizeMap[size]) {
      return this.sizeMap[size];
    }
    return typeof size === 'number' ? `${size}px` : size.toString();
  });

  // Icon type detection
  protected isSvgAsset = computed(() => {
    const icon = this.icon();
    return typeof icon === 'string' && icon.endsWith('.svg');
  });

  protected isFontAwesome = computed(() => {
    const icon = this.icon();
    return (
      !!icon && typeof icon !== 'string' && this.isValidIconDefinition(icon)
    );
  });

  // Type conversions
  protected svgSrc = computed<string>(() => this.icon() as string);
  protected faIcon = computed<IconDefinition>(
    () => this.icon() as IconDefinition,
  );
  protected ngIcon = computed<IconType>(() => this.icon() as IconType);
  private sizeMap: Record<DsIconSize, string> = {
    '2xs': '0.625em', // 10px
    xs: '0.75em', // 12px
    sm: '0.875em', // 14px
    lg: '1.25em', // 20px
    xl: '1.5em', // 24px
    '2xl': '2em', // 32px
  };

  private isValidIconDefinition(value: any): value is IconDefinition {
    return value?.prefix && value?.iconName && value?.icon;
  }

  private isFaSizeKeyword(size: any): size is keyof typeof this.sizeMap {
    return typeof size === 'string' && size in this.sizeMap;
  }

  ngOnInit() {
    if (
      this.icon() &&
      !this.isFontAwesome() &&
      typeof this.icon() !== 'string'
    ) {
      console.error('Invalid icon input:', this.icon());
    }
  }
}
