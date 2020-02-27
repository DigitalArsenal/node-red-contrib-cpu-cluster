import cluster from 'cluster';
import {
  getEligibleWorkers
} from '../utilities/utilities.js'
let roundRobin = 0;

export default function (ipc) {
  if (ipc) {
    let _available = getEligibleWorkers(ipc.nodeID);
    roundRobin = (roundRobin + 1) % (_available.length);
    return [_available[roundRobin]];
  }
};