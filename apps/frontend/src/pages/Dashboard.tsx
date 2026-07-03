import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Grid, Card, CardContent, Typography, Button,
  List, ListItem, ListItemAvatar, Avatar, ListItemText,
  Chip, Skeleton,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import DescriptionIcon from '@mui/icons-material/Description'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import HubIcon from '@mui/icons-material/Hub'

type Student = {
  id: string
  firstName: string
  lastName: string
  email: string
  lifestyle: string
  weeklyFrequency: number
}

function Dashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/students')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setStudents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total Estudiantes', value: students.length, icon: <PeopleIcon />, color: '#4f8ff7' },
    { label: 'Rutinas Activas', value: '—', icon: <FitnessCenterIcon />, color: '#34d399' },
    { label: 'Reportes de Sesión', value: '—', icon: <DescriptionIcon />, color: '#fbbf24' },
    { label: 'Frecuencia Promedio', value: students.length ? Math.round(students.reduce((a, s) => a + s.weeklyFrequency, 0) / students.length) + 'x/sem' : '—', icon: <TrendingUpIcon />, color: '#a78bfa' },
  ]

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Panel de Control
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Resumen general del estado del gimnasio
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" sx={{ color: stat.color }}>
                      {loading ? <Skeleton width={60} /> : stat.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: `${stat.color}1a`, color: stat.color, width: 44, height: 44 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Estudiantes Recientes</Typography>
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/students')}>
                  Ver todos
                </Button>
              </Box>
              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={56} sx={{ borderRadius: 2 }} />)}
                </Box>
              ) : students.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No hay estudiantes registrados.
                </Typography>
              ) : (
                <List disablePadding>
                  {students.slice(0, 5).map((student) => (
                    <ListItem
                      key={student.id}
                      disablePadding
                      secondaryAction={
                        <Chip label={student.lifestyle} size="small" variant="outlined" sx={{ fontSize: 12 }} />
                      }
                      sx={{ mb: 0.5, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' }, cursor: 'pointer' }}
                      onClick={() => navigate(`/students/${student.id}/history`)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'rgba(79, 143, 247, 0.18)', color: 'primary.main', width: 40, height: 40, fontSize: 16 }}>
                          {student.firstName[0]}{student.lastName[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${student.firstName} ${student.lastName}`}
                        secondary={student.email}
                        primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: 12 }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Acciones Rápidas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                <Button variant="contained" startIcon={<PeopleIcon />} fullWidth onClick={() => navigate('/students')}>
                  Gestionar Estudiantes
                </Button>
                <Button variant="outlined" startIcon={<FitnessCenterIcon />} fullWidth onClick={() => navigate('/routines')}>
                  Generar Rutina
                </Button>
                <Button variant="outlined" startIcon={<HubIcon />} fullWidth onClick={() => navigate('/n8n')}>
                  Panel n8n
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
