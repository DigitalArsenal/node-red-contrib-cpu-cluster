import cluster from 'cluster';

export default function (ipc, emittingWorker) {

  let workers = Object.keys(cluster.workers).map(function (workerID) {
    let _worker = cluster.workers[workerID];
    let _omit = ipc && ipc.msg && ipc.msg.omitEmitter && _worker.id === emittingWorker.id;
    if (_worker.isConnected() && !_omit) {
      return _worker;
    }
  });
  return workers;
};