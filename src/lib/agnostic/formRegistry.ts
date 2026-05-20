type SaveFn = () => Promise<void>;
const registry = new Map<string, SaveFn>();

export const registerForm = (id: string, saveFn: SaveFn): (() => void) => {
  registry.set(id, saveFn);
  return () => registry.delete(id);
};

export const saveAllForms = (): Promise<void> =>
  Promise.all([...registry.values()].map(fn => fn())).then(() => {});
