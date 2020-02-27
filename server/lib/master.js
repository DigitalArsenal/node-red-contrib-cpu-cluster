import cluster from 'cluster';
import getBingo from './strategies/getBingo';
import broadcast from './strategies/broadcast';
import roundRobin from './strategies/roundRobin';
import randomWorker from './strategies/randomWorker';
import sendToBingo from './strategies/sendToBingo';

let _RED;

const clusterized = (ipc, _worker) => {
  if (globalThis.clusteRED.redHalted) return;
  globalThis.runtime.stop();
  if (_RED) {
    _RED.server.close();
  }
  console.info(`stopped Node-RED on Master Process: ${process.pid}`);
  globalThis.clusteRED.redHalted = true;
};

let currentRev = null;

const flowRev = (ipc, _worker) => {
  let workers = [];
  if (!currentRev) {
    currentRev = ipc.msg.rev;
  }
  if (currentRev !== ipc.msg.rev) {
    currentRev = ipc.msg.rev;
    workers = broadcast();
    workers.ipc = {
      method: 'reloadWorkerFlows',
      msg: {
        ...ipc.msg
      }
    };
  }
  return workers;
}

const loadClusterWorkerFlows = function (ipc, _worker) {
  let workers = broadcast(_worker);
  workers.ipc = {
    method: 'reloadWorkerFlows'
  };
  return workers;
};

export const masterInit = (RED, app, settings, server) => {

  _RED = RED;

  globalThis.clusteRED = {
    methods: {
      flowRev,
      broadcast,
      getBingo,
      roundRobin,
      clusterized,
      loadClusterWorkerFlows,
      randomWorker,
      sendToBingo
    },
    strategies: {
      randomWorker,
      sendToBingo,
      broadcast,
      roundRobin
    },
    initialized: false,
    bingo: undefined,
    isBingo: false,
    redHalted: false,
    clusterizedWorkers: {}
  };

  /**
   * Route a message from a worker to the correct location.
   * 
   * @param {Object} ipc - The serialized ipc message
   * @param {string} ipc.node - Node-RED node sending the message
   * @param {string} ipc.msg - Message to send
   * @param {object} worker - The worker that sent the message
   */

  const router = function (ipc, worker) {
    const f = globalThis.clusteRED.methods[ipc.node.mode];
    const func = typeof f === 'function' ? f : globalThis.clusteRED.methods['broadcast'];
    let workers = func(ipc, worker);
    if (!workers) return null;
    if (ipc && ipc.node && workers) {
      for (let i = 0; i < workers.length; i++) {
        if (workers.ipc) {
          Object.assign(ipc, workers.ipc);
        }
        ipc.msg.fromMaster = ipc.node.id || true;
        if (workers[i] && workers[i].isConnected()) {
          workers[i].send({
            method: ipc.method,
            msg: ipc.msg
          });
        }
      }
    }
  };

  let cpus = settings.cluster && parseInt(settings.cluster.cpus) ? settings.cluster.cpus : require('os').cpus().length;

  /**
   * Fork a new worker
   * 
   * @param {Object} [deadWorker] - The terminated worker that kicked off the fork
   **/

  let forkFunc = (len) => {
    if (Object.keys(cluster.workers).length >= cpus) return;
    for (let i = 0; i < len; i++) {
      let cp = _fork();
    };
  }

  let _fork = function (deadWorker) {
    let redWorker = cluster.fork();
    redWorker.on('message', (ipc) => {
      router(ipc, redWorker);
    });
    redWorker.on('error', (_e) => {
      try {
        console.log(`IPC error ${_e}`);
      } catch (e) {}
    });
    return redWorker;
  };
  /*
  fs.watchFile(flowPath, debounce(() => {

    let _flows = JSON.parse(fs.readFileSync(flowPath, {
      encoding: 'utf8'
    }));

    // REQUIRED for on / off / on 
    let _wL = Object.keys(cluster.workers).length;

    if (_flows.filter(n => n.type === "cluster").length && _wL < cpus) {
      forkFunc(cpus - _wL);
    }

    router({
      node: {
        mode: 'loadClusterWorkerFlows'
      },
      msg: {
        user: undefined,
        deploymentType: 'full',
        req: {
          user: undefined,
          path: '/flows',
          ip: '127.0.0.1'
        },
        flows: {
          flows: _flows,
        }
      }
    });
  }, 1000));*/


  forkFunc(cpus);

  cluster.on('exit', function (worker, code, signal) {
    if (code !== 99) {
      _fork(worker);
    }
  });
};