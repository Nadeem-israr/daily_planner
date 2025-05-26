import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid, Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, List, ListItem, ListItemText, IconButton, Box, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import HomeButton from './HomeButton';

const MealPlanner = ({ isDarkMode }) => {
  const [meals, setMeals] = useState([]);
  const [manualGroceries, setManualGroceries] = useState({});
  const [open, setOpen] = useState(false);
  const [newMeal, setNewMeal] = useState({ day: '', breakfast: '', lunch: '', dinner: '', ingredients: [] });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDocId, setEditDocId] = useState(null);
  const [expandedMeal, setExpandedMeal] = useState(null);

  // Firestore collections
  const mealsCol = collection(db, 'meals');
  const groceriesCol = collection(db, 'manualGroceries');

  // Move generateGroceryList function before its usage
  const generateGroceryList = () => {
    const groceryMap = {};
    meals.forEach(({ ingredients }) => {
      ingredients.forEach(({ name, quantity }) => {
        if (!name) return;
        groceryMap[name] = (groceryMap[name] || 0) + quantity;
      });
    });
    Object.entries(manualGroceries).forEach(([item, qty]) => {
      if (qty > 0) groceryMap[item] = qty;
      else delete groceryMap[item];
    });
    return groceryMap;
  };

  // Sort meals and groceries for consistent display
  const sortedMeals = [...meals].sort((a, b) => a.day.localeCompare(b.day));
  const sortedGroceries = Object.entries(generateGroceryList()).sort((a, b) => a[0].localeCompare(b[0]));

  useEffect(() => {
    const loadData = async () => {
      const mealsSnapshot = await getDocs(mealsCol);
      const loadedMeals = mealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMeals(loadedMeals);

      const groceriesSnapshot = await getDocs(groceriesCol);
      const loadedGroceries = {};
      groceriesSnapshot.docs.forEach(doc => {
        loadedGroceries[doc.id] = doc.data().quantity;
      });
      setManualGroceries(loadedGroceries);
    };
    loadData();
  }, [groceriesCol, mealsCol]);

  const toggleExpandMeal = (mealId) => {
    setExpandedMeal(expandedMeal === mealId ? null : mealId);
  };

  const handleDeleteMeal = async (docId) => {
    await deleteDoc(doc(db, 'meals', docId));
    setMeals(prev => prev.filter(meal => meal.id !== docId));
  };

  const setManualGrocery = async (item, quantity) => {
    if (quantity <= 0) {
      await deleteDoc(doc(db, 'manualGroceries', item));
      setManualGroceries(prev => {
        const copy = { ...prev };
        delete copy[item];
        return copy;
      });
    } else {
      await setDoc(doc(db, 'manualGroceries', item), { quantity });
      setManualGroceries(prev => ({ ...prev, [item]: quantity }));
    }
  };

  const deleteManualGrocery = async (item) => {
    await deleteDoc(doc(db, 'manualGroceries', item));
    setManualGroceries(prev => {
      const copy = { ...prev };
      delete copy[item];
      return copy;
    });
  };

  const handleSaveMeal = async () => {
    if (isEditMode) {
      await updateDoc(doc(db, 'meals', editDocId), newMeal);
      setMeals(prev => prev.map(m => (m.id === editDocId ? { id: editDocId, ...newMeal } : m)));
    } else {
      const docRef = await addDoc(mealsCol, newMeal);
      setMeals(prev => [...prev, { id: docRef.id, ...newMeal }]);
    }
    handleCloseDialog();
  };

  const handleAddIngredient = () => {
    setNewMeal(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: 1 }]
    }));
  };

  const handleIngredientChange = (index, field, value) => {
    const updatedIngredients = [...newMeal.ingredients];
    updatedIngredients[index][field] = field === 'quantity' ? parseInt(value) || 1 : value;
    setNewMeal(prev => ({ ...prev, ingredients: updatedIngredients }));
  };

  const handleDeleteIngredient = (index) => {
    const updatedIngredients = newMeal.ingredients.filter((_, i) => i !== index);
    setNewMeal(prev => ({ ...prev, ingredients: updatedIngredients }));
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setIsEditMode(false);
    setEditDocId(null);
    setNewMeal({ day: '', breakfast: '', lunch: '', dinner: '', ingredients: [] });
  };

  // Animation variants
  const cardVariants = {
    collapsed: { height: 120 },
    expanded: { height: "auto" }
  };

  const contentVariants = {
    collapsed: { opacity: 0, y: -20 },
    expanded: { opacity: 1, y: 0 }
  };

  // Styles
  const containerStyle = {
    padding: '20px',
    backgroundColor: isDarkMode ? '#121212' : '#fff',
    color: isDarkMode ? '#eee' : '#000',
    minHeight: '100vh',
  };

  const gridWrapperStyle = {
    maxWidth: 1200,
    width: '100%',
    margin: 'auto',
  };

  const mealCardStyle = {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: isDarkMode 
        ? '0 4px 20px rgba(0,0,0,0.3)' 
        : '0 4px 20px rgba(0,0,0,0.1)'
    }
  };

  const groceryTileStyle = {
    backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: isDarkMode 
        ? '0 2px 10px rgba(0,0,0,0.3)' 
        : '0 2px 10px rgba(0,0,0,0.1)'
    }
  };

  const textFieldSx = {
    mt: 1,
    '& .MuiInputBase-input': { color: isDarkMode ? '#eee' : '#000' },
    '& .MuiInputLabel-root': { color: isDarkMode ? '#aaa' : '#000' },
    '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
      borderColor: isDarkMode ? '#555' : '#ccc',
    },
  };

  return (
    <div style={containerStyle}>
      <div style={gridWrapperStyle}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box display="flex" justifyContent="space-between" mb={4}>
              <Typography variant="h4">Meal Planner</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpen(true)}
                sx={{ bgcolor: isDarkMode ? '#80cbc4' : '#1976d2' }}
              >
                Add Meal
              </Button>
            </Box>

            <Grid container spacing={2}>
              {sortedMeals.map((meal) => (
                <Grid item xs={12} sm={6} md={4} key={meal.id}>
                  <motion.div
                    initial="collapsed"
                    animate={expandedMeal === meal.id ? "expanded" : "collapsed"}
                    variants={cardVariants}
                    transition={{ duration: 0.3 }}
                  >
                    <Paper sx={mealCardStyle} onClick={() => toggleExpandMeal(meal.id)}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">{meal.day}</Typography>
                        <IconButton size="small">
                          {expandedMeal === meal.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>

                      <AnimatePresence>
                        {expandedMeal === meal.id && (
                          <motion.div
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                            variants={contentVariants}
                          >
                            <Box mt={2}>
                              <Typography><strong>Breakfast:</strong> {meal.breakfast}</Typography>
                              <Typography><strong>Lunch:</strong> {meal.lunch}</Typography>
                              <Typography><strong>Dinner:</strong> {meal.dinner}</Typography>
                              
                              {meal.ingredients.length > 0 && (
                                <Box mt={2}>
                                  <Typography variant="subtitle2">Ingredients:</Typography>
                                  <List dense>
                                    {meal.ingredients.map(({ name, quantity }, index) => (
                                      <ListItem key={index}>
                                        <ListItemText primary={`${name}: ${quantity}`} />
                                      </ListItem>
                                    ))}
                                  </List>
                                </Box>
                              )}

                              <Box display="flex" gap={1} mt={2}>
                                <Button
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen(true);
                                    setIsEditMode(true);
                                    setEditDocId(meal.id);
                                    setNewMeal(meal);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMeal(meal.id);
                                  }}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </Box>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Grocery List</Typography>
                <Chip 
                  label={`${sortedGroceries.length} items`} 
                  size="small" 
                  sx={{ bgcolor: isDarkMode ? '#80cbc4' : '#1976d2', color: 'white' }}
                />
              </Box>
              
              <Grid container spacing={2}>
                {sortedGroceries.map(([item, quantity]) => (
                  <Grid item xs={12} key={item}>
                    <Paper sx={groceryTileStyle}>
                      <Box flexGrow={1}>
                        <Typography variant="body1" fontWeight="500">
                          {item}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Quantity: {quantity}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} ml={2}>
                        <TextField
                          type="number"
                          value={quantity}
                          onChange={(e) => setManualGrocery(item, Math.max(0, parseInt(e.target.value) || 0))}
                          size="small"
                          sx={{ width: 80 }}
                          InputProps={{ 
                            sx: { 
                              color: isDarkMode ? '#fff' : '#000',
                              '& input': { textAlign: 'center' }
                            } 
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => deleteManualGrocery(item)}
                          sx={{ color: isDarkMode ? '#ff6666' : '#d32f2f' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <HomeButton />

        {/* Add/Edit Meal Dialog */}
        <Dialog open={open} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>{isEditMode ? 'Edit Meal' : 'New Meal'}</DialogTitle>
          <DialogContent>
            <TextField
              label="Day"
              fullWidth
              margin="normal"
              value={newMeal.day}
              onChange={e => setNewMeal({ ...newMeal, day: e.target.value })}
              sx={textFieldSx}
            />
            <TextField
              label="Breakfast"
              fullWidth
              margin="normal"
              value={newMeal.breakfast}
              onChange={e => setNewMeal({ ...newMeal, breakfast: e.target.value })}
              sx={textFieldSx}
            />
            <TextField
              label="Lunch"
              fullWidth
              margin="normal"
              value={newMeal.lunch}
              onChange={e => setNewMeal({ ...newMeal, lunch: e.target.value })}
              sx={textFieldSx}
            />
            <TextField
              label="Dinner"
              fullWidth
              margin="normal"
              value={newMeal.dinner}
              onChange={e => setNewMeal({ ...newMeal, dinner: e.target.value })}
              sx={textFieldSx}
            />

            <Box mt={2}>
              <Typography variant="subtitle1">Ingredients</Typography>
              {newMeal.ingredients.map((ingredient, index) => (
                <Box key={index} display="flex" gap={1} mt={1}>
                  <TextField
                    label="Name"
                    value={ingredient.name}
                    onChange={e => handleIngredientChange(index, 'name', e.target.value)}
                    sx={{ flex: 2 }}
                  />
                  <TextField
                    label="Qty"
                    type="number"
                    value={ingredient.quantity}
                    onChange={e => handleIngredientChange(index, 'quantity', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    onClick={() => handleDeleteIngredient(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddIngredient}
                sx={{ mt: 1 }}
              >
                Add Ingredient
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveMeal} variant="contained">
              {isEditMode ? 'Save Changes' : 'Add Meal'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default MealPlanner;