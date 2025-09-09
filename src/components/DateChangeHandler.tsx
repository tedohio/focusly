'use client';

import { useDateChange } from '@/hooks/useDateChange';

interface DateChangeHandlerProps {
  timezone?: string;
}

export default function DateChangeHandler({ timezone = 'UTC' }: DateChangeHandlerProps) {
  useDateChange(timezone);
  return null; // This component doesn't render anything
}
