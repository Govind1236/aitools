import Module from "module";
type ModuleWithLoad = typeof Module & { _load: (request: string, parent: unknown, isMain: boolean) => unknown; };
const moduleWithLoad = Module as ModuleWithLoad;
const originalLoad = moduleWithLoad._load.bind(moduleWithLoad);
moduleWithLoad._load = function (request, parent, isMain) {
  const mod = originalLoad(request, parent, isMain);
  if (request === "@next/env" && mod && typeof mod === "object" && !("default" in (mod as object))) {
    Object.defineProperty(mod, "default", { value: mod, configurable: true });
  }
  return mod;
};
