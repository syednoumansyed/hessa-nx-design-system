import { inject } from '@angular/core';
import { HesTranslateService } from '@shared/services/hes-translate.service';

/**
 * Utility function to get translated rating label by index (1-based)
 * @param ratingIndex Rating index (1-5)
 * @returns Translated rating label or null if invalid
 */
export function createSupportTicketRatingLabel() {
  const translateService = inject(HesTranslateService);
  return (ratingIndex: number | null) => {
    if (!ratingIndex || ratingIndex < 1 || ratingIndex > 5) {
      return null;
    }

    const translationKeys = [
      'support.rating.very_poor',
      'support.rating.could_be_better',
      'global.okay.btn',
      'support.rating.good',
      'support.feedback.excellent_status',
    ];

    const index = Math.min(ratingIndex, translationKeys.length) - 1;
    const key = translationKeys[index];

    return key ? translateService.translate(key) : null;
  };
}

/**
 * Gets all rating labels as an array for display purposes
 * @returns Array of translated rating labels (index 0 = rating 1)
 */
export function getAllSupportTicketRatingLabels(): string[] {
  const translateService = inject(HesTranslateService);

  return [
    translateService.translate('support.rating.very_poor'),
    translateService.translate('support.rating.could_be_better'),
    translateService.translate('global.okay.btn'),
    translateService.translate('support.rating.good'),
    translateService.translate('support.feedback.excellent_status'),
  ];
}
