export const randomId = (length = 7) => {
  return Math.random().toString(36).substring(length);
};
