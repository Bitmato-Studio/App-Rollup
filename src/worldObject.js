// WorldObject.js
export class WorldObject {
  constructor() {
    return new Proxy({}, {
      get(target, prop, receiver) {
        // Coercion: if used as a primitive, return app.
        if (prop === Symbol.toPrimitive || prop === 'valueOf' || prop === 'toString') {
          return () => app;
        }
        // If app has an own property for this key, return it.
        if (prop in app) {
          return app[prop];
        }
        // Otherwise, fallback to app.get('<prop>')
        return app.get(prop);
      },
      set(target, prop, value, receiver) {
        // If app already has a property, assign directly.
        if (prop in app) {
          app[prop] = value;
          return true;
        }
        // Otherwise, if app has a setter function, use it.
        if (typeof app.set === 'function') {
          app.set(prop, value);
          return true;
        }
        return false;
      },
      ownKeys(target) {
        return Reflect.ownKeys(app);
      },
      getOwnPropertyDescriptor(target, prop) {
        let descriptor = Object.getOwnPropertyDescriptor(app, prop);
        if (descriptor) {
          return descriptor;
        }
        return {
          configurable: true,
          enumerable: true,
          value: app.get(prop)
        };
      }
    });
  }
}

