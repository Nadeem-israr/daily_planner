import React, { useEffect, useState } from 'react';
import { Typography, Paper, Grid } from '@mui/material';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import HomeButton from './HomeButton'; // adjust path as needed

// Firebase imports
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // adjust the path to your firebase config

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, type: 'spring', stiffness: 100, damping: 15 },
  }),
};

const TodaysOverview = ({ isDarkMode, showHomeButton = true }) => {
  const [todayEvents, setTodayEvents] = useState([]);
  const [todayMeals, setTodayMeals] = useState([]);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const dayName = format(new Date(), 'EEEE');

        // Fetch events from Firestore
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const allEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         console.log('All Events:', allEvents); // DEBUG
        const filteredEvents = allEvents.filter(event => {
          if (!event.start) return false;
          try {
            return format(new Date(event.start), 'yyyy-MM-dd') === todayStr;
          } catch {
            return false;
          }
        });
        console.log('Filtered Events for today:', filteredEvents); // DEBUG

        // Fetch meals from Firestore
        const mealsSnapshot = await getDocs(collection(db, 'meals'));
        const allMeals = mealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('All Meals:', allMeals); // DEBUG


        const filteredMeals = allMeals.filter(meal => meal.day === dayName);
        console.log('Filtered Meals for today:', filteredMeals); // DEBUG
        
        setTodayEvents(filteredEvents);
        setTodayMeals(filteredMeals);
      } catch (error) {
        console.error('Error loading data from Firestore:', error);
      }
    };

    loadData();
  }, []);

  const containerStyle = {
    padding: '20px',
    backgroundColor: isDarkMode ? '#121212' : '#fff',
    color: isDarkMode ? '#eee' : '#000',
    minHeight: '100vh',
    transition: 'background-color 0.5s ease, color 0.5s ease',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };

  const paperStyle = {
    p: 2,
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fafafa',
    color: isDarkMode ? '#eee' : '#000',
    borderRadius: '12px',
  };

  const eventTimeStyle = {
    color: isDarkMode ? '#ccc' : '#555',
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const rotateX = ((y - midY) / midY) * -6;
    const rotateY = ((x - midX) / midX) * 6;

    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <div style={containerStyle}>
      {showHomeButton && <HomeButton />}

      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Today's Schedule - {format(new Date(), 'PPPP')}
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {/* Events Card */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              borderRadius: 12,
              transformStyle: 'preserve-3d',
              transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            }}
          >
            <Paper sx={paperStyle} elevation={10}>
              <Typography variant="h6" gutterBottom>
                Events
              </Typography>

              {todayEvents.length === 0 ? (
                <Typography>No events for today.</Typography>
              ) : (
                <AnimatePresence>
                  {todayEvents.map((event, i) => {
                    const startDate = new Date(event.start);
                    const endDate = new Date(event.end);

                    return (
                      <motion.div
                        key={event.id || i}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={listItemVariants}
                        style={{ marginBottom: 12 }}
                      >
                        <Typography sx={{ fontWeight: '600' }}>{event.title}</Typography>
                        <Typography variant="body2" sx={eventTimeStyle}>
                          {isNaN(startDate) ? 'Start time N/A' : format(startDate, 'hh:mm a')} -{' '}
                          {isNaN(endDate) ? 'End time N/A' : format(endDate, 'hh:mm a')}
                        </Typography>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </Paper>
          </motion.div>
        </Grid>

        {/* Meals Card */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              borderRadius: 12,
              transformStyle: 'preserve-3d',
              transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            }}
          >
            <Paper sx={paperStyle} elevation={10}>
              <Typography variant="h6" gutterBottom>
                Meals
              </Typography>

              {todayMeals.length === 0 ? (
                <Typography>No meals planned for today.</Typography>
              ) : (
                <AnimatePresence>
                  {todayMeals.map((meal, i) => (
                    <motion.div
                      key={meal.id || i}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={listItemVariants}
                      style={{ marginBottom: 12 }}
                    >
                      <Typography>
                        <strong>Breakfast:</strong> {meal.breakfast}
                      </Typography>
                      <Typography>
                        <strong>Lunch:</strong> {meal.lunch}
                      </Typography>
                      <Typography>
                        <strong>Dinner:</strong> {meal.dinner}
                      </Typography>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </div>
  );
};

export default TodaysOverview;
