import { isSameDay } from 'date-fns';
import {
  RaiderIOEncounterDefeated,
  RaiderIOEncounterPulled,
  RaiderIOGuildRaidRanking,
  toWlogDifficultiesMap,
  WLOGS_RAID_DIFFICULTY
} from '@/lib/api';
import {
  difficultiesArray,
  FightMap,
  GuildRaidEncounter,
  RAID_DIFFICULTY,
  RaiderIOEncounter,
  RaidInfo,
  GuildRaidEncountersInfo,
  GuildRaidEncountersInfoMap,
  WlogFlattenedFight,
  RAID_DIFFICULTY_SHORT_CODES
} from '@/lib/types';

/** TODO: refactoring */
export class ReportBuilder {
  encounterInfoMap: GuildRaidEncountersInfoMap;
  raid: RaidInfo;

  constructor(raid: RaidInfo) {
    this.encounterInfoMap = new Map();
    this.raid = raid;
  }

  populateEncountersByDifficulty = (
    normalGuildRankings: RaiderIOGuildRaidRanking[],
    heroicGuildRankings: RaiderIOGuildRaidRanking[],
    mythicGuildRankings: RaiderIOGuildRaidRanking[]
  ) => {
    normalGuildRankings.forEach(this.addNormal);
    heroicGuildRankings.forEach(this.addHeroic);
    mythicGuildRankings.forEach(this.addMythic);
  };

  // create a flat map of all encounters defeated and difficulties
  flattenRaidEncounters = (
    gr: RaiderIOGuildRaidRanking
  ): RaiderIOEncounter[] => {
    return this.raid.encounters.map((e) => {
      const lastKill = gr.encountersDefeated.find((ed) => ed.slug === e.rSlug);
      const lastPull = gr.encountersPulled.find((ed) => ed.slug === e.rSlug);

      return (
        lastKill ||
        lastPull ||
        ({ slug: e.rSlug, numPulls: 0 } as RaiderIOEncounter)
      );
    });
  };

  addNormal = (gr: RaiderIOGuildRaidRanking) =>
    this.addByDifficulty('normal', gr);
  addHeroic = (gr: RaiderIOGuildRaidRanking) =>
    this.addByDifficulty('heroic', gr);
  addMythic = (gr: RaiderIOGuildRaidRanking) =>
    this.addByDifficulty('mythic', gr);
  private addByDifficulty = (
    difficulty: RAID_DIFFICULTY,
    gr: RaiderIOGuildRaidRanking
  ) => {
    const raidEncounters = this.flattenRaidEncounters(gr);

    if (this.encounterInfoMap.has(gr.guild.id)) {
      const value = this.encounterInfoMap.get(
        gr.guild.id
      ) as GuildRaidEncountersInfo;
      value[difficulty] = raidEncounters;

      this.encounterInfoMap.set(gr.guild.id, value);
    } else {
      const value = {
        normal: [],
        heroic: [],
        mythic: [],
        bestPulls: [],
        wlogFightMap: new Map(),
        profileUrl: `https://raider.io${gr.guild.path}`
      } as GuildRaidEncountersInfo;

      value[difficulty] = raidEncounters;

      this.encounterInfoMap.set(gr.guild.id, value);
    }
  };

  getEncounterInfoMap = (): GuildRaidEncountersInfoMap => {
    return this.encounterInfoMap;
  };

  getEncounterInfoByGuild = (
    rId: number
  ): GuildRaidEncountersInfo | null | undefined => {
    if (!this.encounterInfoMap.has(rId)) {
      return null;
    } else {
      return this.encounterInfoMap.get(rId);
    }
  };

  getGuildRIds = (): IterableIterator<Number> => {
    return this.encounterInfoMap.keys();
  };

  getRankingsMapIterator = (): IterableIterator<
    [Number, GuildRaidEncountersInfo]
  > => {
    return this.encounterInfoMap.entries();
  };

  setWlogFightsByGuild = (rId: number, wlogFights: FightMap) => {
    const rankings = this.encounterInfoMap.get(rId) as GuildRaidEncountersInfo;
    rankings.wlogFightMap = wlogFights;
    this.encounterInfoMap.set(rId, rankings);
  };

  build = () => {
    this.encounterInfoMap.forEach(this.setBestPullsByGuild);
  };

  private findCorrelatingWLogPull = (
    rId: number,
    encounterID: number,
    info: RaiderIOEncounter | null,
    difficulty: WLOGS_RAID_DIFFICULTY | null
  ) => {
    if (!info || !difficulty) return null;

    const wlogFights = this.encounterInfoMap
      .get(rId)
      ?.wlogFightMap.get(encounterID) as WlogFlattenedFight[];

    if (!wlogFights) return null;

    if ('firstDefeated' in info) {
      const bossKills = wlogFights.filter(
        (f) =>
          f.kill &&
          f.difficulty === Number(difficulty) &&
          isSameDay(info.firstDefeated, f.endTime)
      );

      return bossKills.length ? bossKills[0] : null;
    } else if ('bestPercent' in info) {
      // console.log(
      //   'looking for correlating pull of %s for guild=%s',
      //   info.bestPercent,
      //   rId
      // );

      const bossPulls = wlogFights.filter(
        (f) =>
          !f.kill &&
          f.difficulty === Number(difficulty) &&
          f.bossPercentage === info.bestPercent
      );

      return bossPulls.length ? bossPulls[0] : null;
    }

    return null;
  };

  setBestPullsByGuild = (ranking: GuildRaidEncountersInfo, rId: Number) => {
    const { normal, heroic, mythic } = ranking;

    const bestPulls: GuildRaidEncounter[] = this.raid.encounters.map((e, i) => {
      const nBoss = normal.length ? normal[i] : null;
      const hBoss = heroic.length ? heroic[i] : null;
      const mBoss = mythic.length ? mythic[i] : null;

      // Get best difficulty defeated
      const bossesByLevel = [mBoss, hBoss, nBoss];

      // See if there is a first Kill
      const maxDiffDefeatedIndex = bossesByLevel.findIndex(
        (boss) => boss && 'firstDefeated' in boss
      );

      const maxDifficultyDefeated =
        maxDiffDefeatedIndex >= 0
          ? difficultiesArray.slice().reverse()[maxDiffDefeatedIndex]
          : null;

      const firstKillSummary = maxDifficultyDefeated
        ? (bossesByLevel[maxDiffDefeatedIndex] as RaiderIOEncounterDefeated)
        : null;

      const defeatedAt = firstKillSummary
        ? firstKillSummary.firstDefeated
        : null;

      // See if there is an attempt
      const maxDiffAttempedIndex = bossesByLevel.findIndex(
        (boss) => boss && 'bestPercent' in boss
      );

      const maxDifficultyAttempted =
        maxDiffAttempedIndex >= 0
          ? difficultiesArray.slice().reverse()[maxDiffAttempedIndex]
          : null;

      const bestPullSummary = maxDifficultyAttempted
        ? (bossesByLevel[maxDiffAttempedIndex] as RaiderIOEncounterPulled)
        : null;

      const correlatedWlogKill = this.findCorrelatingWLogPull(
        Number(rId),
        e.id,
        firstKillSummary,
        maxDifficultyDefeated
          ? toWlogDifficultiesMap[maxDifficultyDefeated]
          : null
      );

      const correlatedWlogBestPull = this.findCorrelatingWLogPull(
        Number(rId),
        e.id,
        bestPullSummary,
        maxDifficultyAttempted
          ? toWlogDifficultiesMap[maxDifficultyAttempted]
          : null
      );

      return {
        wlogKillUrl: correlatedWlogKill?.url,
        wlogBestPullUrl: correlatedWlogBestPull?.url,
        encounterID: e.id,
        slug: e.rSlug,
        name: e.name,
        maxDifficultyDefeated,
        defeatedAt,
        maxDifficultyAttempted,
        lowestBossPercentage: bestPullSummary?.bestPercent,
        attemptedAt: bestPullSummary?.pullStartedAt ?? null
      } as GuildRaidEncounter;
    });

    const value = this.encounterInfoMap.get(rId) as GuildRaidEncountersInfo;
    value.bestPulls = bestPulls;

    this.encounterInfoMap.set(rId, value);
  };

  /**
   * Gets the boss the guild is currently progressing on
   *
   * For now we consider this boss to be the first one in the lineup
   * that hasn't been killed at the earliest difficulty.
   */
  toStringCurrentProgressionBossByRId(rId: number) {
    const encounterInfo = this.encounterInfoMap.get(rId);

    const getUndefeatedPulls = (
      pulls: RaiderIOEncounter[],
      difficulty: RAID_DIFFICULTY_SHORT_CODES
    ) => {
      const undefeatedPulls = pulls.filter(
        (p) => 'bestPercent' in p && p.isDefeated === false
      ) as RaiderIOEncounterPulled[];

      return undefeatedPulls.map((p: RaiderIOEncounterPulled) => {
        return {
          ...p,
          difficulty
        };
      });
    };

    const encounters = [
      ...getUndefeatedPulls(encounterInfo?.normal || [], 'N'),
      ...getUndefeatedPulls(encounterInfo?.heroic || [], 'H'),
      ...getUndefeatedPulls(encounterInfo?.mythic || [], 'M')
    ];

    if (!encounters || !encounters.length) {
      return null; // pulls may not have been generated yet.
    }

    const progressionInfo = encounters[0];

    const bossIndex = this.raid.encounters.findIndex(
      (e) => e.rSlug === progressionInfo.slug
    );

    const boss = this.raid.encounters[bossIndex];

    const splitName = boss.name.replace(',', '').split(' ');

    // TODO: automate this?
    const shortName = ['Awakened', 'The'].includes(splitName[0])
      ? splitName[1]
      : splitName[0];

    return `${progressionInfo.difficulty} ${shortName}=${progressionInfo.bestPercent}%`;
  }
}
