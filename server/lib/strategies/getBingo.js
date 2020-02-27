import cluster from 'cluster';
import randomWorker from './randomWorker';

export default function (_worker) {
  let bingo = false;
  let workers = [];
  for (let _id in cluster.workers) {
    let _w = cluster.workers[_id];
    workers.push(_w);
    if (_w.process.bingo) {
      bingo = _w;
    }
  }

  if (!bingo) {
    let _stuckee = randomWorker();
    bingo = _stuckee[0];
    _stuckee[0].process.bingo = true;
  }

  workers.ipc = {
    method: 'setBingo',
    msg: {
      strategies: Object.keys(globalThis.clusteRED.strategies)
    }
  };

  globalThis.clusteRED.bingo = bingo;

  workers.ipc.msg[globalThis.CONSTANTS.BINGO] = bingo.process.pid;

  return workers;
};