'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { ClinicInput } from '../schemas/clinic'

import {
  archiveClinicAction,
  createClinicAction,
  listClinicsAction,
  updateClinicAction,
} from '../server/clinic'

const clinicsQueryKey = ['clinics'] as const

export function useClinics() {
  return useQuery({
    queryKey: clinicsQueryKey,
    queryFn: () => listClinicsAction(),
  })
}

export function useCreateClinic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ClinicInput) =>
      createClinicAction(input),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: clinicsQueryKey,
      }),
  })
}

export function useUpdateClinic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: ClinicInput & { id: string }) =>
      updateClinicAction({
        id,
        ...input,
      }),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: clinicsQueryKey,
      }),
  })
}

export function useArchiveClinic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      archiveClinicAction({ id }),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: clinicsQueryKey,
      }),
  })
}