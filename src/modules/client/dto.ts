export type DoctorClientListSource = {
  id: string
  firstName: string
  paternalLastName: string
  maternalLastName: string | null
  email: string
  phone: string | null
  professionalLicense: string | null
  specialty: string | null
  status: 'active' | 'inactive'
  userId: string | null
}

export function toDoctorClientListItem(doctor: DoctorClientListSource) {
  return {
    id: doctor.id,
    name: [doctor.firstName, doctor.paternalLastName, doctor.maternalLastName].filter(Boolean).join(' '),
    email: doctor.email,
    phone: doctor.phone,
    professionalLicense: doctor.professionalLicense,
    specialty: doctor.specialty,
    status: doctor.status,
    accessState: doctor.userId ? 'linked' as const : 'unlinked' as const,
  }
}
