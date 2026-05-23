export const createViewReentryHandler = (callback: () => void) => {
  let hasEntered = false;

  return () => {
    if (hasEntered) {
      callback();
      return;
    }

    hasEntered = true;
  };
};
