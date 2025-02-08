"use client"
import { cn, formatDateTime } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

const FormattedDateTime = ({ date, className }: { date: string; className?: string }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    setFormattedDate(formatDateTime(date)); // Only format the date on the client
  }, [date]);

  if (!formattedDate) return null; // Avoid rendering during hydration

  return (
    <span className={cn('body-1 text-light-200', className)}>
      {formattedDate}
    </span>
  );
};

export default FormattedDateTime;
