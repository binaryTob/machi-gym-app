export const ExerciseCompletion = z.enum(['SOBRADO', 'AL_LIMITE', 'CON_DIFICULTAD', 'NO_PUDO_TERMINARLO_BIEN'])
export type ExerciseCompletionType = z.infer<typeof ExerciseCompletion>
