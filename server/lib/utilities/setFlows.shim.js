export default function setFlows(_config, type, muteLog, forceStart) {
  console.log(arguments)
  type = type || "full";
  if (settings.safeMode) {
    if (type !== "load") {
      // If in safeMode, the flows are stopped. We cannot do a modified nodes/flows
      // type deploy as nothing is running. Can only do a "load" or "full" deploy.
      // The "load" case is already handled in `load()` to distinguish between
      // startup-load and api-request-load.
      type = "full";
      delete settings.safeMode;
    }
  }

  var configSavePromise = null;
  var config = null;
  var diff;
  var newFlowConfig;
  var isLoad = false;
  if (type === "load") {
    isLoad = true;
    configSavePromise = loadFlows().then(function (_config) {
      config = clone(_config.flows);
      newFlowConfig = flowUtil.parseConfig(clone(config));
      type = "full";
      return _config.rev;
    });
  } else {
    // Clone the provided config so it can be manipulated
    config = clone(_config);
    // Parse the configuration
    newFlowConfig = flowUtil.parseConfig(clone(config));
    // Generate a diff to identify what has changed
    diff = flowUtil.diffConfigs(activeFlowConfig, newFlowConfig);

    // Now the flows have been compared, remove any credentials from newFlowConfig
    // so they don't cause false-positive diffs the next time a flow is deployed
    /*for (var id in newFlowConfig.allNodes) {
      if (newFlowConfig.allNodes.hasOwnProperty(id)) {
        delete newFlowConfig.allNodes[id].credentials;
      }*/
    }

    // Allow the credential store to remove anything no longer needed
    credentials.clean(config);

    // Remember whether credentials need saving or not
    var credsDirty = credentials.dirty();

    // Get the latest credentials and ask storage to save them (if needed)
    // as well as the new flow configuration.
    configSavePromise = credentials.export().then(function (creds) {
      var saveConfig = {
        flows: config,
        credentialsDirty: credsDirty,
        credentials: creds
      }
      return storage.saveFlows(saveConfig);
    });
  }

  return Promise.resolve('')
    .then(function (flowRevision) {
      if (!isLoad) {
        log.debug("saved flow revision: " + flowRevision);
      }
      activeConfig = {
        flows: config,
        rev: flowRevision
      };
      activeFlowConfig = newFlowConfig;
      if (forceStart || started) {
        // Flows are running (or should be)

        // Stop the active flows (according to deploy type and the diff)
        return stop(type, diff, muteLog).then(() => {
          // Once stopped, allow context to remove anything no longer needed
          return context.clean(activeFlowConfig)
        }).then(() => {
          // Start the active flows
          start(type, diff, muteLog).then(() => {
            events.emit("runtime-event", {
              id: "runtime-deploy",
              payload: {
                revision: flowRevision
              },
              retain: true
            });
          });
          // Return the new revision asynchronously to the actual start
          return flowRevision;
        }).catch(function (err) {})
      } else {
        events.emit("runtime-event", {
          id: "runtime-deploy",
          payload: {
            revision: flowRevision
          },
          retain: true
        });
      }
    });
}