import type { NextRequest } from 'next/server';

import { sendDiscordUpdate } from '@/lib/reports/discord.service';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401
    });
  }

  // TODO: ensure cache is invalidated and get latest updates?

  // if (!isDevelopment()) {
  // invalidates current cache - on development we want to be careful with this
  // revalidatePath('/'); // revalidateTag?
  // }

  const response = await sendDiscordUpdate();

  return response;
}
