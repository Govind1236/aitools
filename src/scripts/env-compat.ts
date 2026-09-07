/**
 * Runtime interop shim for running Payload-backed tsx scripts.
 *
 * Payload's `dist/bin/loadEnv.js` does `import nextEnvImport from '@next/env'`.
 * Under tsx/esbuild this access `nextEnvImport.default`, but `@next/env` ships
 * CommonJS with no `.default` export, so loadEnv throws on startup. This shim
 * mirrors the CJS `module.exports` as a non-enumerable `.default` before any
 * `payload` import is evaluated. It must be the FIRST import in a script.
 *
 * See: src/scripts/import-categories.ts, import-tags.ts, validate-catalog-parity.ts
 */
import Module from "module";

type ModuleWithLoad = typeof Module & {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown;
};

const moduleWithLoad = Module as ModuleWithLoad;

const originalLoad = moduleWithLoad._load.bind(moduleWithLoad);

moduleWithLoad._load = function (request, parent, isMain) {
  const mod = originalLoad(request, parent, isMain);
  if (
    request === "@next/env" &&
    mod &&
    typeof mod === "object" &&
    !("default" in (mod as object))
  ) {
    Object.defineProperty(mod, "default", {
      value: mod,
      configurable: true,
    });
  }
  return mod;
};