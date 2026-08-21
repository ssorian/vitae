export type PatientIdentity = {
  firstName: string
  paternalLastName: string | null
  maternalLastName: string | null
  email: string | null
  phone: string | null
}

export type AccountIdentity = {
  name: string
  email: string
  phone?: string | null
}

export function normalizePatientEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null
}

export function normalizePatientPhone(value: string | null | undefined) {
  return value?.replace(/\D/g, '') || null
}

function normalizeName(value: string | null | undefined) {
  return value?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase() || ''
}

export function patientMatchesAccount(patient: PatientIdentity, account: AccountIdentity) {
  const patientName = normalizeName([patient.firstName, patient.paternalLastName, patient.maternalLastName].filter(Boolean).join(' '))
  const accountName = normalizeName(account.name)
  const emailMatches = normalizePatientEmail(patient.email) === normalizePatientEmail(account.email)
  const accountPhone = normalizePatientPhone(account.phone)
  const phoneMatches = accountPhone ? normalizePatientPhone(patient.phone) === accountPhone : true

  return Boolean(patientName && accountName && emailMatches && phoneMatches && patientName === accountName)
}

export function patientFieldsFromAccountName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || 'Paciente',
    paternalLastName: parts.slice(1).join(' ') || null,
  }
}
