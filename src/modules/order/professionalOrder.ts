export function professionalOrderAccessState(error: unknown) {
  return error instanceof Error && error.message === 'UNAUTHORIZED'
    ? { authenticated: false as const, active: false as const }
    : { authenticated: true as const, active: false as const }
}
