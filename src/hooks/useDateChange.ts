import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getToday } from '@/lib/date';

export function useDateChange(timezone: string = 'UTC') {
  const queryClient = useQueryClient();
  const lastDateRef = useRef<string>(getToday(timezone));

  useEffect(() => {
    const checkDateChange = () => {
      const currentDate = getToday(timezone);
      if (currentDate !== lastDateRef.current) {
        // Date has changed, invalidate all date-based queries
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        queryClient.invalidateQueries({ queryKey: ['note'] });
        queryClient.invalidateQueries({ queryKey: ['reflection'] });
        lastDateRef.current = currentDate;
      }
    };

    // Check immediately
    checkDateChange();

    // Check every minute
    const interval = setInterval(checkDateChange, 60000);

    return () => clearInterval(interval);
  }, [queryClient, timezone]);
}
