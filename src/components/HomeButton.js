import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const HomeButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outlined"
      color="primary"
      onClick={() => navigate('/')}
      sx={{
        mb: 3,
        borderRadius: '20px',
        fontWeight: 'bold',
        textTransform: 'none',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        '&:hover': {
          backgroundColor: 'primary.light',
          boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
        },
      }}
    >
      Home
    </Button>
  );
};

export default HomeButton;
