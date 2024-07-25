'use client';
import { format, fromUnixTime, parseISO, formatDistanceToNow } from 'date-fns';

type DefaultDate = {
  dt: string;
  dateFormat: string;
  type: 'default';
};

type DistanceToNowDate = {
  dt: string | number;
  type: 'distance';
  dateFormat?: string;
};

type DateBoxProps = DefaultDate | DistanceToNowDate;

function getFormat(dt: string | number, type: string, options: any) {
  switch (type) {
    case 'distance':
      return formatDistanceToNow(dt);
    default:
      return format(dt, options.dateFormat);
  }
}

export default function DateBox({
  dt,
  type = 'default',
  ...restProps
}: DateBoxProps) {
  let date = null;
  let options = null;

  if (typeof dt === 'string') {
    date = parseISO(dt);
    options = {
      dateFormat: restProps.dateFormat
    };
  } else if (typeof dt === 'number') {
    date = fromUnixTime(dt);
  }

  if (!date) {
    return <p>Invalid Date</p>;
  }

  return (
    <time dateTime={date.toISOString()}>{getFormat(dt, type, options)}</time>
  );
}
