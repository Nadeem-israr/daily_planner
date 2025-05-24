import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import HomeButton from './HomeButton'; // adjust path if needed

import { db } from '../firebase'; // Your firebase config file
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

const locales = { 'en-US': require('date-fns/locale/en-US') };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const SchedulePlanner = ({ isDarkMode }) => {
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', start: '', end: '' });
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    // Subscribe to Firestore collection with real-time updates
    const q = query(collection(db, 'events'), orderBy('start'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsFromFirestore = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          start: data.start.toDate ? data.start.toDate() : new Date(data.start),
          end: data.end.toDate ? data.end.toDate() : new Date(data.end),
        };
      });
      setEvents(eventsFromFirestore);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      alert('Please fill all fields');
      return;
    }

    if (editingEvent) {
      // Update existing event
      const eventRef = doc(db, 'events', editingEvent.id);
      await updateDoc(eventRef, {
        title: newEvent.title,
        start: new Date(newEvent.start),
        end: new Date(newEvent.end),
      });
    } else {
      // Add new event
      await addDoc(collection(db, 'events'), {
        title: newEvent.title,
        start: new Date(newEvent.start),
        end: new Date(newEvent.end),
      });
    }

    setOpen(false);
    setNewEvent({ title: '', start: '', end: '' });
    setEditingEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;

    await deleteDoc(doc(db, 'events', editingEvent.id));

    setOpen(false);
    setNewEvent({ title: '', start: '', end: '' });
    setEditingEvent(null);
  };

  const handleSelectEvent = (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      start: format(event.start, "yyyy-MM-dd'T'HH:mm"),
      end: format(event.end, "yyyy-MM-dd'T'HH:mm"),
    });
    setOpen(true);
  };

  const handleAddEventClick = () => {
    setEditingEvent(null);
    setNewEvent({ title: '', start: '', end: '' });
    setOpen(true);
  };

  const calendarDarkStyles = {
    height: '100vh',
    padding: '20px',
    backgroundColor: '#121212',
    color: '#eee',
  };

  const calendarLightStyles = {
    height: '100vh',
    padding: '20px',
    backgroundColor: '#f5f7fa',
    color: '#222',
  };

  const calendarDarkClassOverrides = `
    .rbc-calendar {
      background-color: #121212 !important;
      color: #eee !important;
      border: none !important;
    }
    .rbc-toolbar button {
      background-color: transparent !important;
      border: 1px solid #4a90e2 !important;
      color: #4a90e2 !important;
    }
    .rbc-toolbar button:hover {
      background-color: #4a90e2 !important;
      color: #fff !important;
    }
    .rbc-day-bg {
      background-color: #1e1e1e !important;
    }
    .rbc-day-slot .rbc-time-slot {
      border-color: #333 !important;
    }
    .rbc-event {
      background-color: #4a90e2 !important;
      border-radius: 8px !important;
      border: none !important;
      color: white !important;
      font-weight: 600;
    }
    .rbc-selected {
      background-color: #50b83c !important;
    }
    .rbc-today {
      background-color: #333 !important;
    }
    .rbc-time-view .rbc-time-gutter {
      background-color: #121212 !important;
      color: #aaa !important;
    }
    .rbc-time-view .rbc-day-slot {
      background-color: #121212 !important;
    }
  `;

  return (
    <>
      {isDarkMode && <style>{calendarDarkClassOverrides}</style>}

      <div style={isDarkMode ? calendarDarkStyles : calendarLightStyles}>
        <Box display="flex" gap={2} mb={2} alignItems="center">
          <HomeButton />
          <Button variant="contained" color="primary" onClick={handleAddEventClick}>
            Add Event
          </Button>
        </Box>

        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          style={{ marginTop: 20, backgroundColor: 'inherit', color: 'inherit' }}
        />

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          PaperProps={{
            style: {
              backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
              color: isDarkMode ? '#eee' : '#000',
            },
          }}
        >
          <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Event Title"
              fullWidth
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              sx={{
                input: { color: isDarkMode ? '#eee' : '#000' },
                label: { color: isDarkMode ? '#aaa' : '#000' },
              }}
            />
            <TextField
              margin="dense"
              label="Start Date & Time"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newEvent.start}
              onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
              sx={{
                input: { color: isDarkMode ? '#eee' : '#000' },
                label: { color: isDarkMode ? '#aaa' : '#000' },
              }}
            />
            <TextField
              margin="dense"
              label="End Date & Time"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newEvent.end}
              onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
              sx={{
                input: { color: isDarkMode ? '#eee' : '#000' },
                label: { color: isDarkMode ? '#aaa' : '#000' },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} sx={{ color: isDarkMode ? '#eee' : '#000' }}>
              Cancel
            </Button>
            {editingEvent && (
              <Button
                onClick={handleDeleteEvent}
                color="error"
                sx={{ mr: 'auto' }}
              >
                Delete
              </Button>
            )}
            <Button onClick={handleSaveEvent} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

export default SchedulePlanner;
