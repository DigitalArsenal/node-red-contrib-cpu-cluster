import cluster from 'cluster';
import {
    getEligibleWorkers
} from '../utilities/utilities.js';

export default function (ipc) {
    let _available = getEligibleWorkers(); //TODO
    let _r = Math.floor(Math.random() * _available.length);
    return [cluster.workers[_available[_r].id]];
};