import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material'
import type { Student, CreateStudentDTO } from '../types/student'

const schema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  email: z.string().email('Email inválido'),
  height: z.coerce.number().int().positive('Debe ser un número positivo'),
  age: z.coerce.number().int().min(13, 'Mínimo 13 años').max(120, 'Máximo 120 años'),
  lifestyle: z.enum(['sedentario', 'activo', 'muy_activo'], {
    required_error: 'Selecciona un estilo de vida',
  }),
  limitations: z.string().optional(),
  weeklyFrequency: z.coerce.number().refine(v => [3, 5].includes(v), {
    message: 'Debe ser 3 o 5 días por semana',
  }),
})

type FormValues = z.infer<typeof schema>

interface StudentFormDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateStudentDTO) => Promise<void>
  student?: Student | null
}

const defaultValues: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  height: 170,
  age: 25,
  lifestyle: 'activo',
  limitations: '',
  weeklyFrequency: 3,
}

export default function StudentFormDialog({ open, onClose, onSubmit, student }: StudentFormDialogProps) {
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: student
      ? {
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          height: student.height,
          age: student.age,
          lifestyle: student.lifestyle as FormValues['lifestyle'],
          limitations: student.limitations || '',
          weeklyFrequency: student.weeklyFrequency as FormValues['weeklyFrequency'],
        }
      : defaultValues,
  })

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit(data as CreateStudentDTO)
    reset()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{student ? 'Editar Estudiante' : 'Nuevo Estudiante'}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Nombre" fullWidth error={!!errors.firstName} helperText={errors.firstName?.message} />
                )}
              />
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Apellido" fullWidth error={!!errors.lastName} helperText={errors.lastName?.message} />
                )}
              />
            </Stack>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Email" fullWidth error={!!errors.email} helperText={errors.email?.message} />
              )}
            />
            <Stack direction="row" spacing={2}>
              <Controller
                name="height"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Altura (cm)" type="number" fullWidth error={!!errors.height} helperText={errors.height?.message} />
                )}
              />
              <Controller
                name="age"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Edad" type="number" fullWidth error={!!errors.age} helperText={errors.age?.message} />
                )}
              />
            </Stack>
            <Controller
              name="lifestyle"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Estilo de vida" select fullWidth error={!!errors.lifestyle} helperText={errors.lifestyle?.message}>
                  <MenuItem value="sedentario">Sedentario</MenuItem>
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="muy_activo">Muy activo</MenuItem>
                </TextField>
              )}
            />
            <Controller
              name="weeklyFrequency"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Frecuencia semanal" select fullWidth error={!!errors.weeklyFrequency} helperText={errors.weeklyFrequency?.message}>
                  <MenuItem value={3}>3 días</MenuItem>
                  <MenuItem value={5}>5 días</MenuItem>
                </TextField>
              )}
            />
            <Controller
              name="limitations"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Limitaciones (opcional)" multiline rows={2} fullWidth error={!!errors.limitations} helperText={errors.limitations?.message} />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {student ? 'Guardar Cambios' : 'Crear Estudiante'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
