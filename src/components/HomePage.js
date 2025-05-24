// HomePage.js
import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, styled, Tooltip, Switch, useTheme
} from '@mui/material';
import {
  CalendarToday, Restaurant, Today, LightMode, DarkMode
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Howl } from 'howler';
import TodaysOverview from './TodaysOverview';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';  // Adjust path to your firebase.js

const FloatingCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '20px',
  minHeight: 250,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: theme.shadows[10],
  },
  background: theme.palette.background.paper,
  position: 'relative',
  overflow: 'hidden',
}));

const ModeToggle = styled('div')({
  position: 'absolute',
  top: 20,
  right: 20,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

const HomePage = ({ toggleTheme, isDarkMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [todaysStats, setTodaysStats] = useState({
    events: 0,
    completed: 0,
    meals: 0,
    groceries: 0,
  });
  const [events, setEvents] = useState([]);
  const sound = new Howl({ src: ['/click.mp3'], volume: 0.5 });

  useEffect(() => {
    const loadTodaysData = async () => {
      try {
        // Fetch all events from Firestore
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const allEvents = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          start: doc.data().start.toDate(), // Convert Firestore Timestamp to JS Date
          end: doc.data().end.toDate(),
        }));

        // Fetch all meals from Firestore
        const mealsSnapshot = await getDocs(collection(db, 'meals'));
        const allMeals = mealsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setEvents(allEvents);

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayWeekday = format(new Date(), 'EEEE');

        // Filter today's events
        const todayEvents = allEvents.filter(event => {
          const startDate = format(new Date(event.start), 'yyyy-MM-dd');
          return startDate === todayStr;
        });

        // Filter today's meals (assuming meals have a "day" field like 'Monday', 'Tuesday', etc.)
        const todayMeals = allMeals.filter(meal => meal.day === todayWeekday);

        setTodaysStats({
          events: todayEvents.length,
          completed: todayEvents.filter(e => e.completed).length,
          meals: todayMeals.length,
          groceries: todayMeals.reduce((acc, meal) => acc + (meal.ingredients?.length || 0), 0),
        });
      } catch (error) {
        console.error('Error loading data from Firestore:', error);
      }
    };

    loadTodaysData();

    const interval = setInterval(loadTodaysData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const cardContent = [
    {
      title: 'Schedule',
      icon: <CalendarToday sx={{ fontSize: 50, color: theme.palette.primary.main }} />,
      path: '/schedule',
      tooltip: 'Plan your day',
    },
    {
      title: 'Diet',
      icon: <Restaurant sx={{ fontSize: 50, color: theme.palette.secondary.main }} />,
      path: '/diet',
      tooltip: 'View and set your meals',
    },
    {
      title: "Today's",
      icon: <Today sx={{ fontSize: 50, color: '#f47721' }} />,
      path: '/today',
      tooltip: 'Get today’s overview',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDarkMode ? '#121212' : 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
        color: theme.palette.text.primary,
        padding: '2rem',
        position: 'relative',
      }}
    >
      {/* Theme Toggle */}
      <ModeToggle>
        <LightMode color={isDarkMode ? 'disabled' : 'action'} />
        <Switch checked={isDarkMode} onChange={toggleTheme} />
        <DarkMode color={isDarkMode ? 'action' : 'disabled'} />
      </ModeToggle>

      <Typography
        variant="h3"
        align="center"
        gutterBottom
        sx={{
          mb: 4,
          fontWeight: 700,
          background: '-webkit-linear-gradient(45deg, #4a90e2, #50b83c)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Daily Planner Pro
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {cardContent.map((item, index) => (
          <Grid item xs={12} md={4} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <Tooltip title={item.tooltip} arrow>
                <FloatingCard
                  onClick={() => {
                    sound.play();
                    navigate(item.path);
                  }}
                >
                  {item.icon}
                  <Typography
                    variant="h4"
                    sx={{
                      mt: 2,
                      fontWeight: 600,
                      background: '-webkit-linear-gradient(45deg, #4a90e2, #50b83c)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {item.title}
                  </Typography>
                  {item.title === "Today's" && (
                    <Typography variant="subtitle1" sx={{ mt: 2, color: '#999' }}>
                      {format(new Date(), 'PPPP')}
                    </Typography>
                  )}
                </FloatingCard>
              </Tooltip>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Interactive today's overview */}
      <div
        style={{
          marginTop: '3rem',
          maxWidth: '900px',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxShadow: isDarkMode
            ? '0 8px 24px rgba(255,255,255,0.1)'
            : '0 8px 24px rgba(0,0,0,0.1)',
          borderRadius: '16px',
          backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
          padding: '2rem',
        }}
      >
        <TodaysOverview
          events={events}
          meals={todaysStats.meals}
          groceries={todaysStats.groceries}
          isDarkMode={isDarkMode}
          showHomeButton={false}
        />
      </div>
    </div>
  );
};

export default HomePage;
