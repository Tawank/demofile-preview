import { useLoadingStore } from '@/stores/loading';
import { DemoFile, type IPlayerInfo } from 'demofile';

export interface Replay {
  tick: number;
  players: {
    [userId: string]: {
      name: string;
      position: [number, number, number];
      rotation: [number, number];
      isAlive: boolean;
    };
  };
  deaths: Array<{
    victim: string;
    attacker: string;
    weapon: string;
    headshot: boolean;
    time: number;
  }>;
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

      const attacker = demoFile.entities.getByUserId(e.attacker);
      const attackerName = attacker ? attacker.name : 'unnamed';

      replay[replay.length - 1].deaths.push({
        victim: victimName,
        attacker: attackerName,
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
              position: [player.position.x, player.position.y, player.position.z],
              rotation: [player.eyeAngles.pitch, player.eyeAngles.yaw],
              isAlive: player.isAlive
            }
          ])
        ),
        deaths: replay.length === 0 ? [] : replay[replay.length - 1].deaths.map(x => ({
          victim: x.victim,
          attacker: x.attacker,
          weapon: x.weapon,
          headshot: x.headshot,
          time: x.time + 1,
        })).filter(x => x.time < 100),
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
