'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createInternalOrderAction,
  listOrdersAction,
} from '#/modules/order/server/generalOrder'

import type {
  CreateOrderInput,
} from '#/modules/order/schemas/generalOrder'

export const ordersQueryKey = ['org-orders'] as const

export function useOrders() {
  return useQuery({
    queryKey: ordersQueryKey,
    queryFn: () => listOrdersAction(),
  })
}

export function useCreateInternalOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: CreateOrderInput) =>
      createInternalOrderAction(values),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ordersQueryKey,
      }),
  })
}