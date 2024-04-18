// import { cache } from 'react';

// export const getItem = cache(async (id: string) => {
//   const item = await db.item.findUnique({ id });
//   return item;
// });

export async function getTime(): Promise<any> {
  const res = await fetch(
    'http://worldtimeapi.org/api/timezone/America/New_York'
  );
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data');
  }

  return res.json();
}
