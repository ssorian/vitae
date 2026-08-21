export function doctorClientResolutionState(existing: unknown) {
  return existing ? 'existing' as const : 'create' as const
}
