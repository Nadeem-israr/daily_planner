// components/ToDoList.js
import React, { useEffect, useState } from 'react';
import {
  Checkbox, IconButton, TextField, List, ListItem, ListItemSecondaryAction, ListItemText, Button
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where, orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

const ToDoList = ({ isDarkMode }) => {
  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState([]);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const fetchTasks = async () => {
    const q = query(
      collection(db, 'todos'),
      where('date', '==', todayStr),
      orderBy('createdAt')
    );
    const snapshot = await getDocs(q);
    setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const addTask = async () => {
    if (taskInput.trim() === '') return;

    await addDoc(collection(db, 'todos'), {
      title: taskInput,
      completed: false,
      createdAt: new Date(),
      date: todayStr,
    });
    setTaskInput('');
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'todos', id));
    fetchTasks();
  };

  const toggleCompletion = async (id, current) => {
    await updateDoc(doc(db, 'todos', id), { completed: !current });
    fetchTasks();
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        marginTop: '3rem',
        padding: '2rem',
        borderRadius: 16,
        backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
        color: isDarkMode ? '#eee' : '#000',
        boxShadow: isDarkMode
          ? '0 8px 24px rgba(255,255,255,0.1)'
          : '0 8px 24px rgba(0,0,0,0.1)',
      }}
    >
      <h2>To-Do List</h2>
      <div style={{ display: 'flex', marginBottom: '1rem' }}>
        <TextField
          fullWidth
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          placeholder="New task..."
          variant="outlined"
          size="small"
        />
        <IconButton onClick={addTask} color="primary" sx={{ ml: 1 }}>
          <Add />
        </IconButton>
      </div>
      <List>
        {tasks.map((task) => (
          <ListItem key={task.id} divider>
            <Checkbox
              checked={task.completed}
              onChange={() => toggleCompletion(task.id, task.completed)}
            />
            <ListItemText
              primary={task.title}
              style={{
                textDecoration: task.completed ? 'line-through' : 'none',
                color: task.completed ? '#888' : 'inherit',
              }}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => deleteTask(task.id)}>
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </motion.div>
  );
};

export default ToDoList;
