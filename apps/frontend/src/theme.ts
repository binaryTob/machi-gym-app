import { createTheme } from '@mui/material/styles'
import type {} from '@mui/x-data-grid/themeAugmentation'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4f8ff7',
      light: '#7ab0ff',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0a0a0f',
      paper: '#16161e',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#9e9e9e',
    },
    divider: '#2a2a3a',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a0f',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #2a2a3a',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-cell': {
            color: '#e0e0e0',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#1a1a26',
            color: '#9e9e9e',
            '& .MuiDataGrid-columnHeader': {
              '&:focus': { outline: 'none' },
            },
          },
          '& .MuiDataGrid-row': {
            '&:hover': { backgroundColor: 'rgba(79, 143, 247, 0.04)' },
            '&.Mui-selected': {
              backgroundColor: 'rgba(79, 143, 247, 0.08)',
              '&:hover': { backgroundColor: 'rgba(79, 143, 247, 0.12)' },
            },
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #2a2a3a',
          },
          '& .MuiTablePagination-root': {
            color: '#9e9e9e',
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          '& .MuiTableHead-root .MuiTableCell-head': {
            backgroundColor: '#1a1a26',
            color: '#9e9e9e',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #2a2a3a',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          '&.MuiChip-outlined': {
            borderColor: '#2a2a3a',
          },
        },
      },
    },
  },
})

export default theme
