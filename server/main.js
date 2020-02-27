/*TODO
  - Consume system information on the cluster.html node
  - Create affinity code (getSpecificWorker)
*/

import {
  masterInit
} from './lib/master';
import {
  workerInit
} from './lib/worker';

import '@ungap/global-this';

import cluster from 'cluster';
import globalThis from '@ungap/global-this';

/*CONSTANTS*/
globalThis.CONSTANTS = {
  BINGO: 'bf4cef5d-25d9-4356-9193-c514d15ad818'
};
for (let pp in require.cache) {
  if (pp.indexOf('runtime/lib/index.js') > -1) {
    globalThis.runtime = require(pp);
  }
}


export default function (RED) {

  function ClusterNode(n) {

    RED.nodes.createNode(this, n);

    let node = this;

    if (cluster.isMaster && !node.___clusterized) {

      node.___clusterized = true;

      masterInit(RED, null, RED.settings, null);

    } else if (cluster.isWorker) {
      workerInit(RED, node, RED.settings, n);
    }


  }

  RED.nodes.registerType("cluster", ClusterNode);
}