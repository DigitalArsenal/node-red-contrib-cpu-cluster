import EventEmitter from 'events';

let startup = () => {

  process.send({
    node: {
      mode: 'clusterized'
    }
  });
  process.send({
    node: {
      mode: 'getBingo'
    }
  });

}

let opts = {
  user: undefined,
  deploymentType: 'reload',
  req: {
    user: undefined,
    path: '/flows',
    ip: '127.0.0.1'
  }
};

export const workerInit = (RED, node, settings, nodeOptions) => {

  startup();

  Object.assign(node, nodeOptions);

  const setBingo = (ipc) => {
    globalThis.clusteRED.masterMethods = ipc.msg.strategies;
    globalThis.clusteRED.bingo = ipc.msg[globalThis.CONSTANTS.BINGO];
    globalThis.clusteRED.isBingo = globalThis.clusteRED.bingo === process.pid;
  };
  setInterval(() => {
     globalThis.runtime.flows.getFlows(opts).then((flow) => {
      process.send({
        node: {
          mode: "flowRev"
        },
        msg: {
          rev: flow.rev,
          clusterNodes: flow.flows.filter(n => n.type === "cluster").length
        }

      });
    }).catch(function (e) {
      console.log(e)
    })
  }, 5000);
  const reloadWorkerFlows = (ipc) => {
    if (!ipc.msg.clusterNodes && !globalThis.clusteRED.isBingo) {
       globalThis.runtime.stop().then(() => {
        RED.server.close();
        process.exit(99);
      });
    }
     globalThis.runtime.flows.setFlows(opts).then(function (msg) {
      node.log(`PID ${process.pid} rev: ${msg.rev}`);
    });

  };

  const runOnBingo = () => {
    return node.mode !== 'runOnBingo' || globalThis.clusteRED.isBingo;
  }

  globalThis.clusteRED = {
    methods: {
      setBingo,
      reloadWorkerFlows
    },
    initialized: false,
    bingo: undefined,
    isBingo: false,
    workers: [],
    nodeREDEvents: new EventEmitter(),
    masterMethods: [],
    workerMethods: {
      runOnBingo
    }
  };

  node._inputCallback = function (msg) {
    if (runOnBingo()) {
      process.send({
        node,
        msg: node.payloadOnly ? {
          payload: msg.payload
        } : msg,
      })
    }
  };

  let _send = node.send;

  node.send = function (msg) {
    if ((msg && msg.fromMaster) && runOnBingo()) {
      delete msg.fromMaster;
      _send.call(node, msg);
    }
  }

  node.on("input", node.send);

  const ipcCallback = function (ipc) {
    if (ipc && ipc.method && globalThis.clusteRED.methods[ipc.method]) {
      globalThis.clusteRED.methods[ipc.method](ipc);
    } else if (ipc.msg && ipc.msg.fromMaster === node.id) {
      node.send(ipc.msg);
    }
  };

  process.on('message', ipcCallback);

  let serverID = '6660d4cd-cc89-4f2a-a20b-1ff66353d26b'

  RED.httpAdmin.get(`/${serverID}`, function (req, res) {
    res.send(globalThis.clusteRED.masterMethods.concat(Object.keys(globalThis.clusteRED.workerMethods)));
  });

  node.on('close', function () {

    process.removeListener('message', ipcCallback);

    RED.httpAdmin._router.stack = RED.httpAdmin._router.stack.filter((route, i, routes) => {
      return route.regexp.toString().indexOf(serverID) === -1
    });

  });
}