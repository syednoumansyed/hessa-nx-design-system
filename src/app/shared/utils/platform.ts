import { inject } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';

export const isMobile = () => {
  const platform = inject(Platform);
  const isMobile = !platform.is('desktop');
  return isMobile;
};

export const isRtl = () => {
  const platform = inject(Platform);
  return platform.isRTL;
};
