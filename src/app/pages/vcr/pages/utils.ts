import { format, addDays, startOfWeek, parse } from 'date-fns';
import { IS_YOUTUBE_LINK } from '@shared/constants/regex-patterns.constant';
export const YOUTUBE_VIDEO_ID_LENGTH = 11;
export const getDayName = (dayOfWeek: number): string => {
  const date = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), dayOfWeek);
  return format(date, 'EEEE');
};

export const convertToAmPm = (time: string, locale?: string): string => {
  const date = parse(time, 'HH:mm', new Date());
  const formatted = format(date, 'hh:mma');
  if (locale === 'ar') {
    return formatted.replace('AM', 'ص').replace('PM', 'م');
  }
  return formatted;
};

export const isYoutubeUrl = (url: string): boolean => {
  const match = url.match(IS_YOUTUBE_LINK);
  return !!(match && match[1].length == YOUTUBE_VIDEO_ID_LENGTH);
};

export function extractYouTubeUrls(text: string): string[] {
  if (!text) {
    return [];
  }

  // 1️⃣  Regex to match:
  //     - https://www.youtube.com/watch?v=abc
  //     - https://youtube.com/shorts/abc
  //     - https://m.youtube.com/watch?v=abc
  //     - https://youtu.be/abc
  //     - with or without protocol
  const ytRegex =
    /\b(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&][^\s]*)?/gi;

  // 2️⃣  Scan the text
  const urls: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = ytRegex.exec(text)) !== null) {
    // RegExp#exec() gives the *whole* match at index 0
    urls.push(match[0]);
  }

  // 3️⃣  De-duplicate while preserving order
  return [...new Set(urls)];
}

export const youtubeUrlToId = (url: string): string | null => {
  const match = url.match(IS_YOUTUBE_LINK);
  if (match && match[1].length == YOUTUBE_VIDEO_ID_LENGTH) {
    return match[1];
  } else {
    return null;
  }
};

export const getThumbnailURL = async (id: string) => {
  const base = `https://i.ytimg.com/vi/${id}`;
  const candidates = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault'];
  for (const file of candidates) {
    const url = `${base}/${file}.jpg`;
    if ((await fetch(url, { method: 'HEAD' })).ok) return url;
  }
  return `${base}/default.jpg`; // last-ditch tiny thumb
};
