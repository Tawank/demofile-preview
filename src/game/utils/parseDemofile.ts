import { useLoadingStore } from '@/stores/loading';
import { DemoFile, type IPlayerInfo } from 'demofile';

export interface DeadPlayer {
  name: string;
  teamNumber: number | null;
}

export interface Death {
  id: string;
  victim: DeadPlayer;
  attacker: DeadPlayer;
  weapon: string;
  headshot: boolean;
  time: number;
}

export interface Replay {
  tick: number;
  players: {
    [userId: string]: {
      name: string;
      teamNumber: number;
      position: [number, number, number];
      rotation: [number, number];
      isAlive: boolean;
    };
  };
  deaths: Array<Death>;
}

export function parseDemofile(
  demoFileRaw: Buffer
): Promise<{ players: IPlayerInfo[]; replay: Replay[]; tickMax: number }> {
  const loadingStore = useLoadingStore();

  return new Promise((resolve) => {
    const demoFile = new DemoFile();
    const players: IPlayerInfo[] = [];
    const replay: Replay[] = [];

    demoFile.stringTables.on('update', (e) => {
      if (e.table.name === 'userinfo' && e.userData != null) {
        players.push(e.userData);
      }
    });

    demoFile.gameEvents.on('player_death', (e) => {
      const victim = demoFile.entities.getByUserId(e.userid);
      const victimName = victim ? victim.name : 'unnamed';
      const victimTeam = victim ? victim.teamNumber : null;

      const attacker = demoFile.entities.getByUserId(e.attacker);
      const attackerName = attacker ? attacker.name : 'unnamed';
      const attackerTeam = attacker ? attacker.teamNumber : null;

      replay[replay.length - 1].deaths.push({
        id: Math.random().toString(36).substring(2, 16),
        victim: {
          name: victimName,
          teamNumber: victimTeam,
        },
        attacker: {
          name: attackerName,
          teamNumber: attackerTeam,
        },
        weapon: e.weapon,
        headshot: e.headshot,
        time: 0,
      });
    });

    demoFile.gameEvents.on('round_end', (e) => {
      console.log(`[${e.winner}] reason: ${e.reason} players left: ${e.player_count}`);
    });

    demoFile.on('tickend', (tick) => {
      if (tick < 0) return;
      replay.push({
        tick,
        players: Object.fromEntries(
          demoFile.players.map((player) => [
            player.userId,
            {
              name: player.name,
              teamNumber: player.teamNumber,
              position: [player.position.x, player.position.y, player.position.z],
              rotation: [player.eyeAngles.pitch, player.eyeAngles.yaw],
              isAlive: player.isAlive
            }
          ])
        ),
        deaths: replay.length === 0 ? [] : replay[replay.length - 1].deaths.map(x => ({
          id: x.id,
          victim: x.victim,
          attacker: x.attacker,
          weapon: x.weapon,
          headshot: x.headshot,
          time: x.time + 1,
        })).filter(x => x.time < 500),
      });
    });

    demoFile.on('progress', (e) => {
      if (Math.round(e * 1000) % 10 === 0) {
        loadingStore.set('Demo File', Math.round(e * 100));
      }
    });

    demoFile.on('end', (e) => {
      resolve({ replay, players, tickMax: replay[replay.length - 1].tick });
      console.log(`icomplete: ${e.incomplete}`);
      console.log(players);
      console.log(replay);
    });

    demoFile.parse(demoFileRaw);
  });
}
