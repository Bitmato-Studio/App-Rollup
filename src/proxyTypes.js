/**
 * Proxy object representing an application entity in the world.
 *
 * @typedef {Object} AppProxy
 * @property {string} instanceId - Unique identifier of the entity.
 * @property {number} version - The version of the entity blueprint.
 * @property {string} modelUrl - The model URL of the entity.
 * @property {any} state - The current state of the entity.
 * @property {Object} props - The properties of the entity blueprint.
 * @property {Object} config - Deprecated. Same as `props`.
 * @method on(name: string, callback: Function): void - Subscribes to an event.
 * @method off(name: string, callback: Function): void - Unsubscribes from an event.
 * @method send(name: string, data: any, ignoreSocketId?: boolean): void - Sends an event to the world network.
 * @method sendTo(name: string, data: any, targetSocketId: string): void - Sends an event to a specific player.
 * @method emit(name: string, data: any): void - Emits an event in the world.
 * @method get(id: string): AppProxy | null - Retrieves a proxy of a node by ID.
 * @method create(name: string, data?: Object): AppProxy - Creates a new node and returns its proxy.
 * @method createClone(): string - Creates a clone of the entity and returns its new ID.
 * @method control(options: Object): Object - Grants control over the entity.
 * @method configure(fnOrArray: Function | Array): void - Configures fields of the entity.
 */


/**
 * Proxy object representing a player in the world.
 *
 * @typedef {Object} PlayerProxy
 * @property {string} networkId - Network ID of the player.
 * @property {string} entityId - Entity ID associated with the player.
 * @property {string} id - The user ID of the player.
 * @property {string} name - The name of the player.
 * @property {THREE.Vector3} position - The player's current position.
 * @property {THREE.Euler} rotation - The player's current rotation.
 * @property {THREE.Quaternion} quaternion - The player's quaternion rotation.
 * @method teleport(position: THREE.Vector3, rotationY: number): void - Moves the player to a new position.
 * @method getBoneTransform(boneName: string): any - Gets the transform of a bone.
 * @method setSessionAvatar(url: string): void - Sets the player's avatar.
 */

/**
 * Proxy object representing the world in which entities exist.
 *
 * @typedef {Object} WorldProxy
 * @property {string} networkId - The ID of the current network instance.
 * @property {boolean} isServer - Whether this instance is a server.
 * @property {boolean} isClient - Whether this instance is a client.
 * @method add(pNode: Object): void - Adds a node to the world.
 * @method remove(pNode: Object): void - Removes a node from the world.
 * @method attach(pNode: Object): void - Attaches a node to the world.
 * @method on(name: string, callback: Function): void - Subscribes to a world event.
 * @method off(name: string, callback: Function): void - Unsubscribes from a world event.
 * @method emit(name: string, data: any): void - Emits an event in the world.
 * @method getTime(): number - Returns the current network time.
 * @method getTimestamp(format?: string): string - Returns a formatted timestamp.
 * @method chat(msg: string, broadcast?: boolean): void - Sends a chat message in the world.
 * @method getPlayer(playerId?: string): PlayerProxy | undefined - Retrieves a player proxy.
 * @method createLayerMask(...groups: string[]): number - Creates a layer mask for physics.
 * @method raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance?: number, layerMask?: number): Object | null - Performs a raycast in the world.
 */

