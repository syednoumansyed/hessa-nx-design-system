export const ENGLISH_ARABIC_DIGITS_DOT_ONLY = `/[^a-zA-Z0-9.\u0600-\u06FF]/g`;
export const IS_VALID_LINK = `^(http|https):\\/\\/.+$`;
export const IS_YOUTUBE_LINK =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^#&?\s]+)/i;
