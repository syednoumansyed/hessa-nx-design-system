import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'linkify',
  standalone: true,
})
export class LinkifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string | undefined | null): SafeHtml {
    if (!text) return '';

    // Regex to match URLs
    const urlRegex = /(https?:\/\/[^\s<]+)/g;

    // Replace URLs with anchor tags while preserving HTML entities and line breaks
    const linkedText = text.replace(
      urlRegex,
      (url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#0969DA] no-underline font-normal text-sm">${url}</a>`,
    );

    // Sanitize the result
    const sanitizedContent = this.sanitizer.sanitize(
      SecurityContext.HTML,
      linkedText,
    );

    // Return the sanitized HTML wrapped in SafeHtml
    return sanitizedContent
      ? this.sanitizer.bypassSecurityTrustHtml(sanitizedContent)
      : '';
  }
}
