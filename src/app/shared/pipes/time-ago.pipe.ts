import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Pipe({
  name: 'hesTimeAgo',
  standalone: true,
  pure: false, // Make pipe impure so it updates when language changes
})
export class TimeAgoPipe implements PipeTransform {
  private readonly translocoService = inject(TranslocoService);

  // Translations for different time formats
  private static TRANSLATIONS = {
    en: {
      now: 'now',
      min: 'min ago',
      mins: 'mins ago',
      hour: 'hour ago',
      hours: 'hours ago',
      yesterday: 'Yesterday at',
      at: 'at',
      am: 'AM',
      pm: 'PM',
      days: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      months: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
    },
    ar: {
      now: 'الآن',
      min: 'دقيقة مضت',
      mins: 'دقائق مضت',
      hour: 'ساعة مضت',
      hours: 'ساعات مضت',
      yesterday: 'الأمس الساعة',
      at: 'في',
      am: 'ص',
      pm: 'م',
      days: [
        'الأحد',
        'الإثنين',
        'الثلاثاء',
        'الأربعاء',
        'الخميس',
        'الجمعة',
        'السبت',
      ],
      months: [
        'يناير',
        'فبراير',
        'مارس',
        'أبريل',
        'مايو',
        'يونيو',
        'يوليو',
        'أغسطس',
        'سبتمبر',
        'أكتوبر',
        'نوفمبر',
        'ديسمبر',
      ],
    },
  };

  transform(value: Date | string | number | null | undefined): string {
    if (value == null) return '';

    // Get current language
    const lang = this.translocoService.getActiveLang() || 'en';

    // Normalize to Date
    const date = value instanceof Date ? value : new Date(value);
    const now = new Date();

    // Calculate time difference in milliseconds
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    const translations =
      TimeAgoPipe.TRANSLATIONS[lang as keyof typeof TimeAgoPipe.TRANSLATIONS] ||
      TimeAgoPipe.TRANSLATIONS.en;

    // 1. Less than 10 minutes: Display as "now"
    if (diffMins < 10) {
      return translations.now;
    }

    // 2. Within 12 hours or same day
    if (
      diffHours < 12 ||
      (now.getDate() === date.getDate() &&
        now.getMonth() === date.getMonth() &&
        now.getFullYear() === date.getFullYear())
    ) {
      if (diffMins < 60) {
        return `${diffMins} ${
          diffMins === 1 ? translations.min : translations.mins
        }`;
      }

      return `${diffHours} ${
        diffHours === 1 ? translations.hour : translations.hours
      }`;
    }

    // Custom time formatting (e.g., "6:00 PM")
    const formattedTime = this.formatTime(date, translations);

    // 3. More than 12 hours and falls on the next day (yesterday)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return `${translations.yesterday} ${formattedTime}`;
    }

    // 4. More than 1 day and less than 1 week
    if (diffDays < 7) {
      const dayName = translations.days[date.getDay()];
      return `${dayName} ${translations.at} ${formattedTime}`;
    }

    // 5. More than 1 week: Custom date formatting
    const formattedDate = this.formatDate(date, lang, translations);

    return `${formattedDate}, ${formattedTime}`;
  }

  private formatTime(date: Date, translations: any): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? translations.pm : translations.am;

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const minutesStr = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${minutesStr} ${ampm}`;
  }

  private formatDate(date: Date, lang: string, translations: any): string {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    if (lang === 'ar') {
      // Arabic format: yyyy/MM/dd
      return `${year}/${month + 1}/${day}`;
    } else {
      // English format: dd/MM/yyyy
      return `${day}/${month + 1}/${year}`;
    }
  }
}
