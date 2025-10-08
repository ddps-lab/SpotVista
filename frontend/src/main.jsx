import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createTheme, ThemeProvider } from '@mui/material';
import Router from './routes/index.jsx';

const rootElement = document.getElementById('root');
rootElement.style.width = '100%';
rootElement.style.height = '100%';
const root = createRoot(rootElement);

const theme = createTheme({
  components: {
    MuiPopover: {
      defaultProps: {
        container: rootElement
      }
    },
    MuiPopper: {
      defaultProps: {
        container: rootElement
      }
    },
    MuiDialog: {
      defaultProps: {
        container: rootElement
      }
    },
    MuiModal: {
      defaultProps: {
        container: rootElement
      }
    }
  },
  palette: {
    sand: {
      main: '#b58d4d',
      light: '#4db58d',
      contrastText: '#fff'
    }
  }
});

root.render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <Router />
    </ThemeProvider>
  </StrictMode>
);
