import { createAnimation, Animation } from '@ionic/angular/standalone';

/**
 * Gets the shadow root of an element, falling back to the element itself.
 * Ionic's modal uses Shadow DOM, so we need to query inside it.
 */
function getRoot(el: HTMLElement): HTMLElement | ShadowRoot {
  return el.shadowRoot || el;
}

/**
 * Returns true if the document direction is RTL.
 */
function isRtl(): boolean {
  return document.documentElement.dir === 'rtl';
}

/**
 * Custom enter animation for the sidebar - slides in from the right (or left in RTL).
 */
export function sidebarEnterAnimation(baseEl: HTMLElement): Animation {
  const root = getRoot(baseEl);
  const offscreen = isRtl() ? '-100%' : '100%';

  const backdropAnimation = createAnimation()
    .addElement(root.querySelector('ion-backdrop')!)
    .fromTo('opacity', 0.01, 'var(--backdrop-opacity)')
    .beforeStyles({ 'pointer-events': 'none' })
    .afterClearStyles(['pointer-events']);

  const wrapperAnimation = createAnimation()
    .addElement(root.querySelector('.modal-wrapper')!)
    .fromTo('transform', `translateX(${offscreen})`, 'translateX(0)')
    .fromTo('opacity', 1, 1);

  return createAnimation()
    .addElement(baseEl)
    .easing('cubic-bezier(0.32, 0.72, 0, 1)')
    .duration(300)
    .addAnimation([backdropAnimation, wrapperAnimation]);
}

/**
 * Custom leave animation for the sidebar - slides out to the right (or left in RTL).
 */
export function sidebarLeaveAnimation(baseEl: HTMLElement): Animation {
  const root = getRoot(baseEl);
  const offscreen = isRtl() ? '-100%' : '100%';

  const backdropAnimation = createAnimation()
    .addElement(root.querySelector('ion-backdrop')!)
    .fromTo('opacity', 'var(--backdrop-opacity)', 0);

  const wrapperAnimation = createAnimation()
    .addElement(root.querySelector('.modal-wrapper')!)
    .fromTo('transform', 'translateX(0)', `translateX(${offscreen})`);

  return createAnimation()
    .addElement(baseEl)
    .easing('cubic-bezier(0.32, 0.72, 0, 1)')
    .duration(250)
    .addAnimation([backdropAnimation, wrapperAnimation]);
}
