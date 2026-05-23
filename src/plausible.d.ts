interface PlausibleFunction {
  (
    eventName: string,
    options?: {
      props?: Record<string, string | number | boolean>;
      callback?: () => void;
    },
  ): void;
  q?: any[][];
  init?: (options?: Record<string, any>) => void;
  o?: Record<string, any>;
}

interface Window {
  plausible: PlausibleFunction;
}
