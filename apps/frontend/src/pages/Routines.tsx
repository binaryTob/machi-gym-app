import { Box, Typography, Paper } from '@mui/material'
import ConstructionIcon from '@mui/icons-material/Construction'

function Routines() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Rutinas</Typography>
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <ConstructionIcon sx={{ fontSize: 48, color: 'grey.600', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Generación de Rutinas
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Próximamente: generación con n8n, historial y seguimiento
        </Typography>
      </Paper>
    </Box>
  )
}

export default Routines
