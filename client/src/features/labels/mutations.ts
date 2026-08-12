import type { LabelAssignment, LabelInput } from '@api/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignLabel, createLabel, deleteLabel, updateLabel } from '../../api/labels'

// Labels ride along on mail, contact and event payloads, so any change invalidates those too.
const LABELLED = [['labels'], ['mail'], ['contacts'], ['calendar']]

function useLabelWrite<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(LABELLED.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
    },
  })
}

export const useCreateLabel = () => useLabelWrite((input: LabelInput) => createLabel(input))

export const useUpdateLabel = () =>
  useLabelWrite(({ id, ...input }: LabelInput & { id: number }) => updateLabel(id, input))

export const useDeleteLabel = () => useLabelWrite((id: number) => deleteLabel(id))

export const useAssignLabel = () => useLabelWrite((input: LabelAssignment) => assignLabel(input))
