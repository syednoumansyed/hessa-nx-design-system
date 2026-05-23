import { PeriodDurationType } from '@shared/enums';
import {
  durationForm,
  durationsForm,
} from '@shared/dto-transformation/time-period/time-period.interface';

export class TimePeriodUtils {
  static setPeriodDurationNumbers(durations: durationsForm) {
    let periodNumber = 1;
    durations.controls.forEach((duration: durationForm) => {
      if (
        duration.get('periodDurationType')?.value !== PeriodDurationType.BREAK
      ) {
        duration
          .get('durationNumber')
          ?.setValue(periodNumber ? periodNumber.toString() : '');
        periodNumber++;
      } else {
        duration.get('durationNumber')?.setValue('');
      }
    });
  }
}
