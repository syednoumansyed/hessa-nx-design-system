/**
 * Timer utility functions for assessment components
 */

export interface TimerConfig {
  dueDate: string;
  duration: number; // in seconds
}

export interface TimerResult {
  remainingSeconds: number;
  isTimeUp: boolean;
  isUsingDuration: boolean; // true if using duration limit, false if using due date limit
}

/**
 * Calculate the remaining time for an assessment based on duration and due date
 * @param config Timer configuration with dueDate and duration
 * @returns TimerResult with remaining seconds and time up status
 */
export function calculateRemainingTime(config: TimerConfig): TimerResult {
  const { dueDate, duration } = config;
  const now = new Date();
  const dueDateObj = new Date(dueDate);

  // Calculate time until due date
  const timeUntilDueDate = Math.floor(
    (dueDateObj.getTime() - now.getTime()) / 1000,
  );

  // If due date has passed, time is up
  if (timeUntilDueDate <= 0) {
    return {
      remainingSeconds: 0,
      isTimeUp: true,
      isUsingDuration: false,
    };
  }

  // If no duration is specified, use due date only
  if (!duration || duration <= 0) {
    return {
      remainingSeconds: timeUntilDueDate,
      isTimeUp: false,
      isUsingDuration: false,
    };
  }

  // Use the smaller of the two: time until due date or exam duration
  // This handles cases where student starts exam close to due date
  const remainingSeconds = Math.min(timeUntilDueDate, duration);

  return {
    remainingSeconds: Math.max(0, remainingSeconds),
    isTimeUp: remainingSeconds <= 0,
    isUsingDuration: duration < timeUntilDueDate,
  };
}

/**
 * Format seconds to HH:MM:SS format
 * @param seconds Total seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if time is in warning state (less than 5 minutes)
 * @param seconds Remaining seconds
 * @returns True if in warning state
 */
export function isTimeWarning(seconds: number): boolean {
  return seconds > 0 && seconds <= 300; // 5 minutes
}

/**
 * Check if time is in critical state (less than 1 minute)
 * @param seconds Remaining seconds
 * @returns True if in critical state
 */
export function isTimeCritical(seconds: number): boolean {
  return seconds > 0 && seconds <= 60; // 1 minute
}
