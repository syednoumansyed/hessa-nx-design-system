import { startOfDay, endOfDay, getUnixTime } from 'date-fns';

interface DateRange {
  startDate: number; // Unix timestamp in seconds
  endDate: number; // Unix timestamp in seconds
}

export const getDateRangeToDayStartEnd = ({
  startDate,
  endDate,
}: DateRange): DateRange => {
  return {
    startDate: getUnixTime(startOfDay(new Date(startDate * 1000))), // Start of the day
    endDate: getUnixTime(endOfDay(new Date(endDate * 1000))), // End of the day
  };
};
