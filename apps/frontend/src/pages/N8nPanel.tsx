import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import SyncIcon from '@mui/icons-material/Sync'
import { fetchHealth, fetchLogs, triggerRoutineGeneration, fetchStudentLogs } from '../api/integration'
import { fetchStudents } from '../api/students'
import type { IntegrationHealth, IntegrationLog } from '../api/integration'
import type { Student } from '../types/student'

const statusIcon: Record<string, JSX.Element> = {
  PENDING: <HourglassEmptyIcon fontSize="small" />,
  PROCESSING: <SyncIcon fontSize="small" sx={{ animation: 'spin 1s linear infinite' }} />,
  SUCCESS: <CheckCircleIcon fontSize="small" />,
  ERROR: <ErrorIcon fontSize="small" />,
}

const statusColor: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  PENDING: 'default',
  PROCESSING: 'warning',
  SUCCESS: 'success',
  ERROR: 'error',
}

const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  SUCCESS: 'Éxito',
  ERROR: 'Error',
}

export default function N8nPanel() {
  const [health, setHealth] = useState<IntegrationHealth | null>(null)
  const [logs, setLogs] = useState<IntegrationLog[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [triggerOpen, setTriggerOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [h, l, s] = await Promise.all([
      fetchHealth().catch(() => null),
      fetchLogs().catch(() => []),
      fetchStudents().catch(() => []),
    ])
    if (h) setHealth(h)
    if (l) setLogs(l)
    if (s) setStudents(s)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleTrigger = async (studentId: string) => {
    setGenerating(true)
    try {
      await triggerRoutineGeneration(studentId)
      setSnackbar({ message: 'Rutina encolada para generación', severity: 'success' })
      setTriggerOpen(false)
      await loadData()
    } catch (err) {
      setSnackbar({ message: err instanceof Error ? err.message : 'Error', severity: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">n8n</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<PlayArrowIcon />} onClick={() => setTriggerOpen(true)}>
            Generar Rutina
          </Button>
          <IconButton onClick={loadData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Redis
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{
                width: 10, height: 10, borderRadius: '50%',
                bgcolor: health?.redis === 'connected' ? 'success.main' : 'error.main',
              }} />
              <Typography variant="body1" fontWeight={600}>
                {health?.redis === 'connected' ? 'Conectado' : 'Desconectado'}
              </Typography>
            </Stack>
            {health?.redisError && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {health.redisError}
              </Typography>
            )}
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Webhook n8n
            </Typography>
            <Typography variant="body2" fontFamily="monospace">
              {health?.n8nWebhook || '—'}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Estado
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {health?.redis === 'connected' ? 'Operativo' : 'Requiere Redis'}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Logs de Integración</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Estado</TableCell>
                <TableCell>Estudiante</TableCell>
                <TableCell>Webhook</TableCell>
                <TableCell>Inicio</TableCell>
                <TableCell>Completado</TableCell>
                <TableCell>Reintentos</TableCell>
                <TableCell>Error</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                    {loading ? 'Cargando...' : 'No hay logs de integración'}
                  </TableCell>
                </TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Chip
                      icon={statusIcon[log.status]}
                      label={statusLabel[log.status]}
                      color={statusColor[log.status]}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {log.studentId?.slice(0, 12)}…
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8rem' }}>
                    {log.webhookUrl}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {new Date(log.startedAt).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {log.completedAt ? new Date(log.completedAt).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell>{log.retryCount}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8rem', color: 'error.main' }}>
                    {log.errorMessage || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={triggerOpen} onClose={() => setTriggerOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generar Rutina</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona un estudiante para encolar la generación de una nueva rutina vía n8n.
          </Typography>
          {students.map((s) => (
            <Button
              key={s.id}
              fullWidth
              variant="outlined"
              sx={{ justifyContent: 'flex-start', mb: 1, textTransform: 'none', p: 1.5 }}
              onClick={() => handleTrigger(s.id)}
              disabled={generating}
            >
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {s.firstName} {s.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {s.email} — {s.lifestyle} — {s.weeklyFrequency}d/sem
                </Typography>
              </Box>
            </Button>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTriggerOpen(false)} color="inherit">Cancelar</Button>
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
