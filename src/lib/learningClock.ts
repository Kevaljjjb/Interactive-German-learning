export function learningClock() {
  return globalThis.performance?.now() ?? 0
}
