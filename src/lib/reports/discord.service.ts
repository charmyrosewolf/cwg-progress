import { sendDiscordMessage } from '@/app/_actions/discord';
import { RAIDS } from '../data';
import { getHost, getUnixTimestampInSeconds } from '@/lib/utils/helper';
import { RaidInfo, RaidProgressEvent } from '@/lib/types';

import { generateProgressReportBySlug } from './report';

export async function getLatestEvents({ slug }: RaidInfo) {
  let report = await generateProgressReportBySlug(slug);

  if (!report) return null;

  const daysWorthofUpdates = 1;

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - daysWorthofUpdates);

  const updates = report
    ? report.recentEvents.filter((e) => e.dateOccurred > sinceDate)
    : [];

  return updates;
}

export function buildDiscordMessage(
  recentUpdates: Array<Array<RaidProgressEvent>>,
  time: Date,
  host: string
): string {
  let message = `# Updates for <t:${getUnixTimestampInSeconds(time)}:D>\n\n`;

  for (const re of recentUpdates) {
    message += `## ${re[0].raidName}\n`;
    for (const u of re) {
      const ts = getUnixTimestampInSeconds(u.dateOccurred);

      switch (u.type) {
        case 'KILL':
          message += `${u.guildName} defeated ${u.bossName} <t:${ts}:R> at <t:${ts}:t>\n`;
          break;
        case 'BEST':
          message += `${u.guildName} achieved a new best of ${u.lowestPercentage}% on ${u.bossName} <t:${ts}:R> at <t:${ts}:t>\n`;
      }
    }
  }

  message += `\nTo see the changes go to ${host}\n`;

  return message;
}

export async function sendDiscordUpdate() {
  const host = getHost();

  const time = new Date();

  const recentUpdatesPromises = RAIDS.map(getLatestEvents);

  const recentUpdates = (await Promise.all(recentUpdatesPromises)).filter(
    (ru) => ru && ru.length
  ) as Array<Array<RaidProgressEvent>>;

  if (!recentUpdates || !recentUpdates.length) {
    return new Response('No updates were found.', {
      status: 200
    });
  }

  const message = buildDiscordMessage(recentUpdates, time, host);

  return await sendDiscordMessage(message);
}
