import {
  RAID_DIFFICULTY,
  GuildInfo,
  GuildRaidEncounter,
  GuildRaidProgress,
  RaidInfo,
  ProgressReport
} from './types';

// TODO: update this each season.
import { RAIDS } from './data/df.s4';
import { GUILDS } from './data/guilds';

import { fetchGuildProgressionByDifficulty } from './api/raiderio.api';

const difficultiesArray: RAID_DIFFICULTY[] = ['normal', 'heroic', 'mythic'];

async function createGuildProgressionReport(
  raid: RaidInfo,
  guild: GuildInfo
): Promise<GuildRaidProgress> {
  const normalProgress = await fetchGuildProgressionByDifficulty(
    raid.slug,
    guild,
    'normal'
  );

  const heroicProgress = await fetchGuildProgressionByDifficulty(
    raid.slug,
    guild,
    'heroic'
  );

  const mythicProgress = await fetchGuildProgressionByDifficulty(
    raid.slug,
    guild,
    'mythic'
  );

  // For each POSSIBLE encounter, determine the highest difficulty defeated, if any
  const raidEncounters = raid.encounters.map((pe) => {
    const findByBossName = (e: any) => e.name === pe.name;

    const nBoss = normalProgress.raid_encounters?.find(findByBossName);
    const hBoss = heroicProgress.raid_encounters?.find(findByBossName);
    const mBoss = mythicProgress.raid_encounters?.find(findByBossName);

    const difficulties = [nBoss, hBoss, mBoss];

    const maxIndexDefeated = difficulties.findLastIndex(
      (boss) => boss?.defeatedAt
    );

    const maxDifficultyDefeated =
      maxIndexDefeated >= 0 ? difficultiesArray[maxIndexDefeated] : null;

    const bossDefeated = difficulties[maxIndexDefeated];

    // TODO: here would be the opportunity to fetch best pull info if maxDifficultyDefeated = null
    //   and add more properties to GuildRaidEncounter type

    return {
      slug: pe.rSlug,
      name: pe.name,
      maxDifficultyDefeated: maxDifficultyDefeated,
      defeatedAt:
        bossDefeated && bossDefeated.defeatedAt ? bossDefeated.defeatedAt : null
    } as GuildRaidEncounter;
  });

  const raidStats = normalProgress.raid_progression[raid.slug];

  const guildProgress: GuildRaidProgress = {
    guild: guild,
    faction: normalProgress.faction,
    profileUrl: normalProgress.profile_url,
    raidEncounters: raidEncounters,
    stats: {
      summary: raidStats.summary,
      totalBosses: raidStats.total_bosses,
      normalBossesKilled: raidStats.normal_bosses_killed,
      heroicBossesKilled: raidStats.heroic_bosses_killed,
      mythicBossesKilled: raidStats.mythic_bosses_killed
    }
  };

  return guildProgress;
}

export async function generateProgressReport(): Promise<ProgressReport[]> {
  const results: ProgressReport[] = [];

  // Fetch progress per raid
  for (const r of RAIDS) {
    let raidProgression: GuildRaidProgress[] = [];

    // Fetch raid progress per guild
    for (const g of GUILDS) {
      const result = await createGuildProgressionReport(r, g);

      raidProgression.push(result);
    }

    results.push({
      raid: r,
      raidProgression: raidProgression
    } as ProgressReport);
  }

  return results;
}
