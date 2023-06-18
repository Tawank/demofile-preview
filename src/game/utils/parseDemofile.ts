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
export interface ReplayPlayerInfo {
  name: string;
  teamNumber: number;
  health: number;
  armor: number;
  position: [number, number, number];
  rotation: [number, number];
  isAlive: boolean;
}

export interface Replay {
  tick: number;
  players: {
    [userId: string]: ReplayPlayerInfo;
  };
  deaths: Array<Death>;
  round: {
    time: number;
    freeze: boolean;
  }
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

    demoFile.gameEvents.on('round_start', (e) => {
      replay[replay.length - 1].round.time = e.timelimit;
      replay[replay.length - 1].round.freeze = true;
    });
    demoFile.gameEvents.on('round_freeze_end', () => {
      replay[replay.length - 1].round.freeze = false;
    });

    demoFile.on('tickend', (tick) => {
      if (tick < 0) return;
      const lastReplay = replay[replay.length - 1];
      replay.push({
        tick,
        players: Object.fromEntries(
          demoFile.players.map((player) => [
            player.userId,
            {
              name: player.name,
              health: player.health,
              armor: player.armor,
              teamNumber: player.teamNumber,
              position: [player.position.x, player.position.y, player.position.z],
              rotation: [player.eyeAngles.pitch, player.eyeAngles.yaw],
              isAlive: player.isAlive
            }
          ])
        ),
        deaths: replay.length === 0 ? [] : lastReplay.deaths.map(x => ({
          id: x.id,
          victim: x.victim,
          attacker: x.attacker,
          weapon: x.weapon,
          headshot: x.headshot,
          time: x.time + 1,
        })).filter(x => x.time < 500),
        round: {
          time: replay.length === 0 ? 0 : lastReplay.round.time - (lastReplay.round.freeze ? 0 : 1/32),
          freeze: replay.length === 0 ? true : lastReplay.round.freeze,
        },
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
