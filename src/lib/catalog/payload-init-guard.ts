// ------------------------------------------------------------------
// PAYLOAD INITIALIZATION GUARD (narrow compatibility wrapper)
// ------------------------------------------------------------------
// Upstream bug (still present as of payload / @payloadcms/db-sqlite 3.88.0,
// and in the 3.x and main branches):
//
// @payloadcms/db-sqlite `dist/connect.js` wraps the SQLite connect in a
// try/catch. On failure it calls `this.rejectInitializing()` with NO
// argument. That rejects the adapter's internal `initializing` promise.
// Nothing in the Payload read path awaits that promise (only
// `beginTransaction` does), so the rejection is unhandled. Node's default
// `unhandledRejection` behavior then terminates the process with
// ERR_UNHANDLED_REJECTION — even when `getPayload()` itself rejects and the
// caller (our catalog repository) handles it and falls back to Prisma.
//
// There is no released patch and no public API to observe the `initializing`
// gate. The adapter's `initializing: Promise<void>` is a typed member of the
// DatabaseAdapter interface (declared by `@payloadcms/db-sqlite` itself), and
// `config.db.init` is the adapter factory that runs before `connect`. So the
// smallest safe wrapper attaches a rejection handler to every adapter the
// moment it is created.
//
// IMPORTANT: this does NOT swallow the connect failure. `connect.js` still
// throws after rejecting, `getPayload()` still rejects, and the catalog
// repository still catches it and falls back to Prisma. This handler only
// prevents the otherwise-unobserved internal gate from crashing the process.
// ------------------------------------------------------------------

/**
 * The adapter surface that exposes the internal initializing gate. `payload`'s
 * `DatabaseAdapter` interface carries `initializing: Promise<void>` via
 * `@payloadcms/db-sqlite`'s module augmentation, but the concrete SQLiteAdapter
 * type is not assignable to that augmented interface (its `beginTransaction`
 * takes a narrower options type). We only need the gate, so constrain on it.
 */
type DatabaseAdapterWithConfig = {
  initializing: Promise<void>;
};

/**
 * Attach a no-op rejection handler to a Payload database adapter's internal
 * `initializing` gate so a failed adapter connect surfaces only as a normal
 * `getPayload()` rejection (contained by the caller) instead of an unhandled
 * promise rejection that terminates the Node process.
 */
export function guardPayloadInitialization<T extends DatabaseAdapterWithConfig>(
  adapter: T,
): T {
  void adapter.initializing.catch(() => {
    // No-op on purpose. The db-sqlite error path rejects with `undefined` and
    // has already logged the real connect error; our catalog repository logs
    // the Prisma fallback. The gate's rejection is informational only.
  });
  return adapter;
}