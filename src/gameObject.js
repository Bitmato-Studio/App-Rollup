import { WorldObject } from './worldObject'

export const SEND_RATE = 1 / 8;

export class GameObject {
  constructor(sendRate = SEND_RATE, runSendState=true) {
    this.sendRate = sendRate;
    this.root = new WorldObject();

    
    this.lastSent = 0;
    this.ownerId = null;
    this.worldId = app.instanceId;
    this.localUserId = world.getPlayer()?.id;
    this.emote = null;
    
    // State stored as a Map for advanced state handling.
    this.state = new Map();
    
    // For custom event callbacks.
    this.customEvents = new Map();
    
    // Store registered event listeners for cleanup.
    this._registeredCallbacks = [];
    
    // Extensibility hooks (can be overridden in subclasses)
    this.beforeUpdateClient = () => {};
    this.afterUpdateClient = () => {};
    this.beforeUpdateServer = () => {};
    this.afterUpdateServer = () => {};
    this.onOwnershipChanged = (oldOwner, newOwner) => {};

    // Allow custom lerp objects or easing via lerpConfig.
    this.setupLerps();
    this.setupEvents();

    if (world.isServer) {
      this.setupBaseState();

      if (runSendState) {
        this.sendState();
      }
    }
  }

  setupBaseState() {
    this.setState('position', this.root.position.toArray());
    this.setState('quaternion', this.root.quaternion.toArray());
    this.setState('velocity', [0,0,0]);
    this.setState('props', props);

    this.setState('ready', true);
  }

  setupEvents() {
    // Register event listeners and store them for later cleanup.
    const objMoveListener = (e) => this.handleEvent('objectMove', e);
    app.on('objectMove', objMoveListener);
    this._registeredCallbacks.push({ target: app, event: 'objectMove', handler: objMoveListener });
    
    const takeOwnershipListener = (id) => this.handleEvent('takeOwnership', id);
    app.on('takeOwnership', takeOwnershipListener);
    this._registeredCallbacks.push({ target: app, event: 'takeOwnership', handler: takeOwnershipListener });

    const updateListener = (delta) => this.handleEvent('update', delta);
    app.on('update', updateListener);
    this._registeredCallbacks.push({ target: app, event: 'update', handler: updateListener });

    const fixedUpdateListener = (delta) => this.handleEvent('fixedUpdate', delta);
    app.on('fixedUpdate', fixedUpdateListener);
    this._registeredCallbacks.push({ target: app, event: 'fixedUpdate', handler: fixedUpdateListener });

    const userJoinsWorld = (player) => this.handleEvent('enter', player);
    world.on('enter', userJoinsWorld);
    this._registeredCallbacks.push({ target: world, event: 'enter', handler: userJoinsWorld});

    if (world.isClient) {
      const updateStateListener = (s) => this.updateState(s);
      app.on('updateState', updateStateListener);
      this._registeredCallbacks.push({ target: app, event: 'updateState', handler: updateStateListener });

      const updateStatePlayerListener = (d) => this.updateStatePlayer(d);
      app.on('updateStatePlayer', updateStatePlayerListener);
      this._registeredCallbacks.push({ target: app, event: 'updateStatePlayer', handler: updateStatePlayerListener });
    }
  }

  setupLerps() {
    // Use custom interpolators if provided in lerpConfig; otherwise, default.
    this.npos = new LerpVector3(app.position, this.sendRate);
    this.nqua = new LerpQuaternion(app.quaternion, this.sendRate);
  }

  handleEvent(type, data) {
    try {
      // Run before-update hooks on update events.
      if (type === 'fixedUpdate') {
        if (world.isServer) {
          this.beforeUpdateServer(data);
        } else {
          this.beforeUpdateClient(data);
        }
      }

      // Determine the proper handler based on server/client.
      const handlerName = `${type}${world.isServer ? 'Server' : 'Client'}`;
      if (typeof this[handlerName] === 'function') {
        this[handlerName](data);
      }

      this.callCustomEvent(type, data);
      
      // Run after-update hooks on update events.
      if (type === 'fixedUpdate') {
        if (world.isServer) {
          this.afterUpdateServer(data);
        } else {
          this.afterUpdateClient(data);
        }
      }
    } catch (error) {
      console.error(`Error handling event ${type}:`, error);
    }
  }

  callCustomEvent(type, data) {
    if (this.customEvents.has(type)) {
        const callbacks = this.customEvents.get(type);
        for (let cb of callbacks) {
          try {
            cb(data);
          } catch (err) {
            console.error(`Error in custom event callback for ${type}:`, err);
          }
        }
      }
  }

  // Custom event emitter apply
  addEventListener(event, callback, appScope=true) {
    const isRegisteredCallback = this._registeredCallbacks.some(cb =>
      Object.values(cb).some(value =>
        typeof value === 'string' && value.includes(event)
      )
    );

    if (!isRegisteredCallback) {
      let owner = appScope ? app : world;
      owner.on(event, callback);
      return;
    }

    if (!this.customEvents.has(event)) {
      this.customEvents.set(event, []);
    }
    this.customEvents.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (this.customEvents.has(event)) {
      const arr = this.customEvents.get(event);
      const idx = arr.indexOf(callback);
      if (idx !== -1) {
        arr.splice(idx, 1);
      }
    }
  }

  updateStatePlayer(data) {
    if (world.isServer) { return; }
    if (data.id === localUserId) {
      this.state = data.state;
    }
  }

  // Ownership management with an ownership-changed hook.
  takeOwnershipServer(newOwnerId) {
    const oldOwner = this.ownerId;
    this.ownerId = newOwnerId;
    this.setState('ownerId', this.ownerId);
    app.send('takeOwnership', newOwnerId);
    this.onOwnershipChanged(oldOwner, newOwnerId);
  }

  takeOwnershipClient(newOwnerId) {
    if (this.ownerId !== newOwnerId) {
      const oldOwner = this.ownerId;
      this.ownerId = newOwnerId;
      this.npos.snap();
      this.nqua.snap();
      this.onOwnershipChanged(oldOwner, newOwnerId);
    }
  }

  // Object movement handling: update state and apply new transforms.
  objectMoveServer(event) {
    try {
      if (event.position) {
        this.root.position.fromArray(event.position);
      }
      if (event.quaternion) {
        this.root.quaternion.fromArray(event.quaternion);
      }
      app.send('objectMove', event);
    } catch (err) {
      console.error('Error in objectMoveServer:', err);
    }
  }

  objectMoveClient(event) {
    try {
      if (this.ownerId !== world.networkId) {
        this.npos.pushArray(event.position);
        this.nqua.pushArray(event.quaternion);
        this.emote = event.emote;
      }
    } catch (err) {
      console.error('Error in objectMoveClient:', err);
    }
  }

  enterServer(player) {
    app.send('updateStatePlayer', { id: player.id, state: this.state});
  }

  // Fixed update events (server)
  fixedUpdateServer(delta) {
    if (this.ownerId) {
      return;
    }
    this.lastSent += delta;
    if (this.lastSent > this.sendRate) {
      this.lastSent = 0;
      this.beforeUpdateServer(delta);
      this.updateServer(delta);
      this.afterUpdateServer(delta);
    }
  }

  // Fixed update events (client) – can be overridden if needed.
  fixedUpdateClient(delta) {
  }

  // Regular update events for client interpolation.
  updateClient(delta) {
    this.beforeUpdateClient(delta);
    if (this.ownerId !== world.networkId) {
      this.npos.update(delta);
      this.nqua.update(delta);
    } else {
      this.lastSent += delta;
      if (this.sendRate <= 0.0 || this.lastSent < this.sendRate) { return; }

      this.setState('position', this.root.position.toArray());
      this.setState('quaternion', this.root.quaternion.toArray());
    
      app.send('objectMove', {
        position: this.state.get('position'),
        quaternion: this.state.get('quaternion'),
        emote: this.state.get('emote') || null,
      });
      this.lastSent = 0;
    }
    this.afterUpdateClient(delta);
  } 

  // On the server, updateServer sends the current state.
  updateServer() {

    if (this.sendRate <= 0.0 || this.lastSent < this.sendRate) { return; }

    this.setState('position', this.root.position.toArray());
    this.setState('quaternion', this.root.quaternion.toArray());
  
    app.send('objectMove', {
      position: this.state.get('position'),
      quaternion: this.state.get('quaternion'),
      emote: this.state.get('emote') || null,
    });
    this.lastSent = 0;
  }

  // Advanced state synchronization: update only changed properties.
  updateStateDelta(deltaState) {
    for (const key in deltaState) {
      if (deltaState.hasOwnProperty(key)) {
        this.state.set(key, deltaState[key]);
        app.state[key] = deltaState[key];
      }
    }
  }

  // State management (full state update)
  setState(key, value, send=false) {
    this.state.set(key, value);
    app.state[key] = value;
    if (send)
      this.sendState();
  }

  sendState(onlyServer = true) {
    if (!world.isServer && onlyServer) { return; } // only the server can update the state
    app.send('updateState', this.state);
  }

  updateState(state) {
    this.state = state;
    app.state = state;
    this.callCustomEvent('updateState', state);
  }

  // Public API: claim ownership if matching local network ID.
  take(newId) {
    if (newId !== world.networkId) {
      return;
    }
    const oldOwner = this.ownerId;
    this.ownerId = world.networkId;
    app.send('takeOwnership', this.ownerId);
    this.onOwnershipChanged(oldOwner, this.ownerId);
  }

  // Robust ownership transition.
  transitionOwnership(newOwnerId) {
    const oldOwner = this.ownerId;
    if (oldOwner === newOwnerId) {
      return; // No change.
    }
    if (world.isServer) {
      this.takeOwnershipServer(newOwnerId);
    } else {
      this.takeOwnershipClient(newOwnerId);
    }
  }

  // Cleanup: remove all event listeners and clear custom events.
  destroy() {
    for (const { target, event, handler } of this._registeredCallbacks) {
      if (typeof target.off === 'function') {
        target.off(event, handler);
      }
    }
    this._registeredCallbacks = [];
    this.customEvents.clear();
    // Additional cleanup can be added here.
  }
}

