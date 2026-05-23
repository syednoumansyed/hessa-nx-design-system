export class AcademicYearUtils {
  static getOrdinalSuffix(num?: string | number): string {
    if (num === undefined) {
      return '';
    }
    const n = typeof num === 'string' ? parseInt(num, 10) : num;
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return suffix[(v - 20) % 10] || suffix[v] || suffix[0];
  }
}
