export function matchesClinicOrder(clinicId: string, order: { clinicId: string } | null | undefined) {
  return order?.clinicId === clinicId
}
