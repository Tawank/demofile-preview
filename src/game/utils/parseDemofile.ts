import { DemoFile, IPlayerInfo } from 'demofile';
import { loading } from './loader';

export interface Replay {
  tick: number,
  players: {
    [userId: string]: {
      name: string,
      position: [number, number, number],
      rotation: [number, number],
      isAlive: boolean,
    },
  },
}

export function parseDemofile(demoFileRaw: Buffer): Promise<{players: IPlayerInfo[], replay: Replay[], tickMax: number}> {
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

      const headshotText = e.headshot ? ' HS' : '';

      console.log(
        `${attackerName} [${e.weapon}${headshotText}] ${victimName}`,
      );
    });

    demoFile.gameEvents.on('round_end', (e) => {
      console.log(
        `[${e.winner}] reason: ${e.reason} players left: ${e.player_count}`,
      );
    });

    demoFile.on('tickend', (tick) => {
      if (tick < 0) return;
      replay.push({
        tick,
        players: Object.fromEntries(demoFile.players.map(player => ([player.userId, {
          name: player.name,
          position: [player.position.x, player.position.y, player.position.z],
          rotation: [player.eyeAngles.pitch, player.eyeAngles.yaw],
          isAlive: player.isAlive,
        }])))
      });
    });

    demoFile.on('progress', (e) => {
      if (Math.round(e * 1000) % 10 === 0) {
        loading(`Demo File ${(e * 100).toFixed(0)}%`);
      }
    });

    demoFile.on('end', (e) => {
      resolve({replay, players, tickMax: replay[replay.length - 1].tick});
      console.log(`icomplete: ${e.incomplete}`);
      console.log(players);
      console.log(replay);
    });

    demoFile.parse(demoFileRaw);
  });
}