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
};

type DateProps = DefaultDate | DistanceToNowDate;

function getFormat(dt: string | number, type: string, options: any) {
  switch (type) {
    case 'distance':
      return formatDistanceToNow(dt);
      break;
    default:
      return format(dt, options.dateFormat);
  }
}

export default function Date({
  dt,
  type = 'default',
  ...restProps
}: DateProps) {
  let date = null;

  if (typeof dt === 'string') {
    date = parseISO(dt);
  } else if (typeof dt === 'number') {
    date = fromUnixTime(dt);
  }

  if (!date) {
    return <p>Invalid Date</p>;
  }

  console.log('DATE', date?.toISOString());

  return (
    <time dateTime={date.toISOString()}>{getFormat(dt, type, restProps)}</time>
  );
}
