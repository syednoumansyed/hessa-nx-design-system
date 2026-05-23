import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LottieIconMappingService {
  private readonly iconMapping: Record<string, string> = {
    feed: 'assets/json/lottie/feed.json',
    course: 'assets/json/lottie/course.json',
    'user-group': 'assets/json/lottie/user-management.json',
    structure: 'assets/json/lottie/school-structure.json',
    loudspeaker: 'assets/json/lottie/announcement.json',
    chat: 'assets/json/lottie/chat.json',
    attendance: 'assets/json/lottie/attendance.json',
    support: 'assets/json/lottie/roles.json', // fallback to roles icon
    report: 'assets/json/lottie/report.json',
    vcr: 'assets/json/lottie/VCR.json',
    pickup: 'assets/json/lottie/pickup.json',
    car: 'assets/json/lottie/pickup.json',
    journal: 'assets/json/lottie/journal.json',
    'grade-mgmt': 'assets/json/lottie/grade-management.json',
    'grade-management': 'assets/json/lottie/grade-management.json',
    'learning-outcome': 'assets/json/lottie/learning-outcome.json',
  };

  getLottieIconPath(iconName: string): string {
    return this.iconMapping[iconName] || 'assets/json/lottie/feed.json'; // fallback to feed icon
  }

  hasLottieIcon(iconName: string): boolean {
    return !!this.iconMapping[iconName];
  }
}
