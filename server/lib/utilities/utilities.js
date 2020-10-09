import cluster from "cluster";

export const getWorkerPIDs = (a) =>
  Object.keys(cluster.workers).map((w) => cluster.workers[w].process.pid);

export const numWorkers = (a) => Object.keys(cluster.workers).length;

export const workerByIndex = (i) =>
  cluster.workers[Object.keys(cluster.workers)[i]];

export const getEligibleWorkers = (nodeID) => {
  let _r = Object.keys(cluster.workers).map((m) => {
    return cluster.workers[m];
  });
  if (nodeID) {
    _r = _r.filter((w) => w.nodeREDCOMM[nodeID]);
  }
  return _r;
};

function noop() {}

export const console = global.console
  ? global.console
  : {
      log: noop,
      info: noop,
      warn: noop,
      error: noop,
      dir: noop,
      assert: noop,
      time: noop,
      timeEnd: noop,
      trace: noop,
    };
