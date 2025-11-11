// src/components/CustomToaster.jsx
import { Toaster } from 'react-hot-toast';

function CustomToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        success: {
          style: {
            fontFamily: '"Poppins", sans-serif',
            fontSize: '16px',
            fontWeight: 500,
            color: '#5649B6',
            background: 'white',
          },
          iconTheme: {
            primary: '#5649B6',
            secondary: 'white',
          },
        },

        error: {
          style: {
            fontFamily: '"Poppins", sans-serif',
            fontSize: '16px',
            fontWeight: 500,
            color: '#EF4444', // vermelho para erro
            background: 'white',
          },
          iconTheme: {
            primary: '#EF4444',
            secondary: 'white',
          },
        },
        
        loading: {
          style: {
            fontFamily: '"Poppins", sans-serif',
            fontSize: '16px',
            fontWeight: 500,
          },
        },
      }}
    />
  );
}

export default CustomToaster;