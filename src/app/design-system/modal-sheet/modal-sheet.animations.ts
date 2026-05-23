import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

export const sheetStateAnimation = trigger('sheetState', [
  state(
    'active',
    style({
      transform: 'translateY(0) scale(1)',
      opacity: 1,
      borderTopLeftRadius: '20px',
      borderTopRightRadius: '20px',
    }),
  ),
  state(
    'behind',
    style({
      transform: 'translateY(-1.3%) scale(0.98)',
      opacity: 1,
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px',
    }),
  ),
  state(
    'hidden',
    style({
      transform: 'translateY(-0.5%) scale(0.96)',
      opacity: 0,
      display: 'none',
    }),
  ),

  // Sheet enters: slides up from bottom
  transition('void => active', [
    style({ transform: 'translateY(100%)', opacity: 1 }),
    animate('350ms cubic-bezier(0.32, 0.72, 0, 1)'),
  ]),

  // Sheet exits: slides down
  transition('active => void', [
    animate(
      '300ms ease-in',
      style({ transform: 'translateY(100%)', opacity: 1 }),
    ),
  ]),

  // Current top sheet pushed behind by new sheet
  transition('active => behind', [
    animate('350ms cubic-bezier(0.32, 0.72, 0, 1)'),
  ]),

  // Behind sheet comes back to active (sheet above dismissed)
  transition('behind => active', [
    animate('300ms cubic-bezier(0.32, 0.72, 0, 1)'),
  ]),

  // Deeper sheet appears as behind (was hidden, now peeking)
  transition('hidden => behind', [
    animate('300ms cubic-bezier(0.32, 0.72, 0, 1)'),
  ]),

  // Sheet pushed deeper into stack
  transition('behind => hidden', [animate('200ms ease-in')]),
]);

export const backdropAnimation = trigger('backdrop', [
  state('visible', style({ opacity: 1 })),
  state('hidden', style({ opacity: 0 })),
  transition('hidden => visible', animate('300ms ease-out')),
  transition('visible => hidden', animate('250ms ease-in')),
]);
