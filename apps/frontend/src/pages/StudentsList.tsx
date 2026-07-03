import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataGrid, type GridColDef, type GridRowParams } from '@mui/x-data-grid'
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import { fetchStudents, createStudent, updateStudent, deleteStudent } from '../api/students'
import { triggerRoutineGeneration } from '../api/integration'
import type { Student, CreateStudentDTO, UpdateStudentDTO } from '../types/student'
import StudentFormDialog from '../components/StudentFormDialog'

export default function StudentsList() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchStudents()
      setStudents(data)
    } catch {
      setSnackbar({ message: 'Error al cargar estudiantes', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStudents() }, [loadStudents])

  const handleCreate = () => {
    setEditingStudent(null)
    setFormOpen(true)
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormOpen(true)
  }

  const handleFormSubmit = async (data: CreateStudentDTO) => {
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, data as UpdateStudentDTO)
        setSnackbar({ message: 'Estudiante actualizado', severity: 'success' })
      } else {
        await createStudent(data)
        setSnackbar({ message: 'Estudiante creado', severity: 'success' })
      }
      setFormOpen(false)
      setEditingStudent(null)
      await loadStudents()
    } catch (err) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Error', severity: 'error' })
    }
  }

  const handleGenerateRoutine = async (student: Student) => {
    try {
      await triggerRoutineGeneration(student.id, `Rutina ${student.firstName}`)
      setSnackbar({ message: `Rutina encolada para ${student.firstName}`, severity: 'success' })
    } catch (err) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Error', severity: 'error' })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteStudent(deleteTarget.id)
      setSnackbar({ message: 'Estudiante eliminado', severity: 'success' })
      setDeleteTarget(null)
      await loadStudents()
    } catch (err) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Error al eliminar', severity: 'error' })
    }
  }

  const columns: GridColDef[] = [
    { field: 'firstName', headerName: 'Nombre', flex: 1, minWidth: 120 },
    { field: 'lastName', headerName: 'Apellido', flex: 1, minWidth: 120 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 200 },
    { field: 'age', headerName: 'Edad', width: 80, type: 'number' },
    { field: 'height', headerName: 'Altura (cm)', width: 100, type: 'number' },
    {
      field: 'lifestyle',
      headerName: 'Estilo de vida',
      width: 130,
      valueFormatter: (value: string) => {
        const map: Record<string, string> = { sedentario: 'Sedentario', activo: 'Activo', muy_activo: 'Muy activo' }
        return map[value] || value
      },
    },
    { field: 'weeklyFrequency', headerName: 'Días/sem', width: 90, type: 'number' },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 170,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Ver historial">
            <IconButton size="small" onClick={() => navigate(`/students/${params.row.id}/history`)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Generar rutina">
            <IconButton size="small" color="primary" onClick={() => handleGenerateRoutine(params.row)}>
              <SmartToyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => handleEdit(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" color="error" onClick={() => setDeleteTarget(params.row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Estudiantes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Nuevo Estudiante
        </Button>
      </Box>

      <Paper sx={{ height: 'calc(100vh - 220px)', width: '100%' }}>
        <DataGrid
          rows={students}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          sx={{ border: 'none' }}
        />
      </Paper>

      <StudentFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingStudent(null) }}
        onSubmit={handleFormSubmit}
        student={editingStudent}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Eliminar Estudiante</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar a <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancelar</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)} variant="filled">
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  )
}
