import React, { useEffect, useState, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Preloader from "./Preloader";
import HomePage from './components/HomePage';
import SchedulePlanner from './components/SchedulePlanner';
import MealPlanner from './components/MealPlanner';
import TodaysOverview from './components/TodaysOverview';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

function App() {
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Simulate loading screen for 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Toggle dark/light mode
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Memoized theme to prevent unnecessary recalculations
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode: isDarkMode ? 'dark' : 'light',
        primary: {
          main: '#4a90e2',
        },
        secondary: {
          main: '#50b83c',
        },
        background: {
          default: isDarkMode ? '#121212' : '#f5f7fa',
          paper: isDarkMode ? '#1e1e1e' : '#ffffff',
        },
      },
      typography: {
        fontFamily: "'Inter', sans-serif",
      },
    }), [isDarkMode]
  );

  if (loading) {
    return <Preloader />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={<HomePage toggleTheme={toggleTheme} isDarkMode={isDarkMode} />} 
          />
          <Route path="/schedule" element={<SchedulePlanner isDarkMode={isDarkMode} />} />
          <Route path="/diet" element={<MealPlanner isDarkMode={isDarkMode}/>} />
          <Route path="/today" element={<TodaysOverview isDarkMode={isDarkMode}/>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
