import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Button, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, List, ListItem, ListItemText, IconButton, Box, Fade, Zoom
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { db } from '../firebase';  // import your firebase config
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  setDoc
} from 'firebase/firestore';
import HomeButton from './HomeButton';

const MealPlanner = ({ isDarkMode }) => {
  const [meals, setMeals] = useState([]);
  const [manualGroceries, setManualGroceries] = useState({});
  const [open, setOpen] = useState(false);
  const [newMeal, setNewMeal] = useState({ day: '', breakfast: '', lunch: '', dinner: '', ingredients: [] });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDocId, setEditDocId] = useState(null);

  // Firestore collection refs
  const mealsCol = collection(db, 'meals');
  const groceriesCol = collection(db, 'manualGroceries');

  // Load meals and manual groceries from Firestore on mount
  useEffect(() => {
    const loadData = async () => {
      // Load meals
      const mealsSnapshot = await getDocs(mealsCol);
      const loadedMeals = mealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMeals(loadedMeals);

      // Load manual groceries
      const groceriesSnapshot = await getDocs(groceriesCol);
      const loadedGroceries = {};
      groceriesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        loadedGroceries[doc.id] = data.quantity;
      });
      setManualGroceries(loadedGroceries);
    };
    loadData();
  }, []);

  // Delete meal by Firestore doc ID
  const handleDeleteMeal = async (docId) => {
    await deleteDoc(doc(db, 'meals', docId));
    setMeals(prev => prev.filter(meal => meal.id !== docId));
  };

  // Generate grocery list by summing ingredients + manual groceries
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

  // Update or delete manual grocery in Firestore
  const updateManualGrocery = async (item, quantity) => {
    if (quantity <= 0) {
      await deleteDoc(doc(db, 'manualGroceries', item));
      setManualGroceries(prev => {
        const copy = { ...prev };
        delete copy[item];
        return copy;
      });
    } else {
      await addDoc(collection(db, 'manualGroceriesTemp'), { item, quantity }); // workaround for doc IDs not matching item name, we fix below
      // But better to do update using doc id == item name (Firestore doc ids can be any string)
      await updateDoc(doc(db, 'manualGroceries', item), { quantity }).catch(async () => {
        // If doc doesn't exist, create it
        await setDoc(doc(db, 'manualGroceries', item), { quantity });
      });
      setManualGroceries(prev => ({ ...prev, [item]: quantity }));
    }
  };

  // Better manual grocery update with setDoc (create or update)
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

  // Delete manual grocery
  const deleteManualGrocery = async (item) => {
    await deleteDoc(doc(db, 'manualGroceries', item));
    setManualGroceries(prev => {
      const copy = { ...prev };
      delete copy[item];
      return copy;
    });
  };

  // Save meal: add or update Firestore doc
  const handleSaveMeal = async () => {
    if (isEditMode) {
      // update
      await updateDoc(doc(db, 'meals', editDocId), newMeal);
      setMeals(prev => prev.map(m => (m.id === editDocId ? { id: editDocId, ...newMeal } : m)));
    } else {
      // add new
      const docRef = await addDoc(mealsCol, newMeal);
      setMeals(prev => [...prev, { id: docRef.id, ...newMeal }]);
    }
    handleCloseDialog();
  };

  // Ingredient handlers
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

  // Styles and animation handlers (same as your original code)...

  const containerStyle = {
    padding: '20px',
    background: isDarkMode
      ? 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)'
      : 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
    color: isDarkMode ? '#eee' : '#000',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    transition: 'background 0.5s ease, color 0.5s ease',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const gridWrapperStyle = {
    maxWidth: 1100,
    width: '100%',
    margin: 'auto',
  };

  const paperStyle = {
    padding: '20px',
    backgroundColor: isDarkMode ? '#2c2c2c' : '#fff',
    color: isDarkMode ? '#eee' : '#000',
    borderRadius: '16px',
    boxShadow: isDarkMode
      ? '0 12px 24px rgba(0,0,0,0.8)'
      : '0 12px 24px rgba(0,0,0,0.1)',
    transition: 'background-color 0.5s ease, color 0.5s ease',
    transformStyle: 'preserve-3d',
    perspective: 1000,
  };

  const mealCardStyle = {
    bgcolor: isDarkMode ? '#3a3a3a' : '#fafafa',
    borderRadius: 12,
    boxShadow: isDarkMode
      ? '0 8px 20px rgba(0,0,0,0.8)'
      : '0 8px 20px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
  };

  const textFieldSx = {
    mt: 1,
    '& .MuiInputBase-input': { color: isDarkMode ? '#eee' : '#000' },
    '& .MuiInputLabel-root': { color: isDarkMode ? '#aaa' : '#000' },
    '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
      borderColor: isDarkMode ? '#555' : '#ccc',
    },
    '&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
      borderColor: isDarkMode ? '#80cbc4' : '#1976d2',
    },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: isDarkMode ? '#80cbc4' : '#1976d2',
    },
  };

  const buttonStyle = { color: isDarkMode ? '#eee' : '#000' };

  const [tiltStyle, setTiltStyle] = useState({});

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const rotateX = ((y - midY) / midY) * 10;
    const rotateY = ((x - midX) / midX) * -10;

    setTiltStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`,
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      transition: 'transform 0.1s ease',
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'rotateX(0deg) rotateY(0deg) scale(1)',
      boxShadow: isDarkMode
        ? '0 8px 20px rgba(0,0,0,0.8)'
        : '0 8px 20px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s ease',
    });
  };

  return (
    <div style={containerStyle}>
      <div style={gridWrapperStyle}>
        <Grid container spacing={6} justifyContent="center" alignItems="flex-start">
          <Grid item xs={12} md={7}>
            <Box display="flex" gap={2} mb={4} justifyContent="space-between" alignItems="center">
              <Typography variant="h4" component="h1" fontWeight="bold" sx={{ color: isDarkMode ? '#80cbc4' : '#1976d2' }}>
                Meal Planner
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpen(true)}
                sx={{ bgcolor: isDarkMode ? '#80cbc4' : '#1976d2', color: '#fff' }}
              >
                Add Meal
              </Button>
            </Box>

            <Grid container spacing={3}>
              {meals.length === 0 && (
                <Typography variant="body1" sx={{ color: isDarkMode ? '#aaa' : '#555' }}>
                  No meals planned yet. Click "Add Meal" to get started!
                </Typography>
              )}
              {meals.map((meal) => (
                <Grid item xs={12} sm={6} key={meal.id}>
                  <Paper
                    elevation={8}
                    sx={{ ...mealCardStyle, ...tiltStyle, p: 3 }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {meal.day}
                    </Typography>
                    <Typography><strong>Breakfast:</strong> {meal.breakfast}</Typography>
                    <Typography><strong>Lunch:</strong> {meal.lunch}</Typography>
                    <Typography><strong>Dinner:</strong> {meal.dinner}</Typography>
                    <Typography variant="subtitle2" mt={1}>Ingredients:</Typography>
                    <List dense>
                      {meal.ingredients.map(({ name, quantity }, i) => (
                        <ListItem key={i} disablePadding>
                          <ListItemText primary={`${name}: ${quantity}`} />
                        </ListItem>
                      ))}
                    </List>
                    <Box display="flex" justifyContent="space-between" mt={1}>
                      <Button
                        size="small"
                        onClick={() => {
                          setOpen(true);
                          setIsEditMode(true);
                          setEditDocId(meal.id);
                          setNewMeal({
                            day: meal.day,
                            breakfast: meal.breakfast,
                            lunch: meal.lunch,
                            dinner: meal.dinner,
                            ingredients: meal.ingredients,
                          });
                        }}
                        sx={buttonStyle}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleDeleteMeal(meal.id)}
                        sx={buttonStyle}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={10} sx={{ ...paperStyle, p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Grocery List
              </Typography>
              <List dense>
                {Object.entries(generateGroceryList()).length === 0 && (
                  <Typography sx={{ color: isDarkMode ? '#aaa' : '#555' }}>
                    No items in grocery list.
                  </Typography>
                )}
                {Object.entries(generateGroceryList()).map(([item, quantity]) => (
                  <ListItem key={item} secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => deleteManualGrocery(item)}
                      sx={{ color: isDarkMode ? '#ff6666' : '#d32f2f' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }>
                    <TextField
                      size="small"
                      label={item}
                      type="number"
                      value={quantity}
                      onChange={(e) => setManualGrocery(item, Math.max(0, parseInt(e.target.value) || 0))}
                      sx={{ width: 100 }}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: 0 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>

        <HomeButton />

        {/* Dialog for Add/Edit Meal */}
        <Dialog open={open} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>{isEditMode ? 'Edit Meal' : 'Add New Meal'}</DialogTitle>
          <DialogContent>
            <TextField
              label="Day"
              fullWidth
              margin="dense"
              value={newMeal.day}
              onChange={e => setNewMeal(prev => ({ ...prev, day: e.target.value }))}
              sx={textFieldSx}
            />
            <TextField
              label="Breakfast"
              fullWidth
              margin="dense"
              value={newMeal.breakfast}
              onChange={e => setNewMeal(prev => ({ ...prev, breakfast: e.target.value }))}
              sx={textFieldSx}
            />
            <TextField
              label="Lunch"
              fullWidth
              margin="dense"
              value={newMeal.lunch}
              onChange={e => setNewMeal(prev => ({ ...prev, lunch: e.target.value }))}
              sx={textFieldSx}
            />
            <TextField
              label="Dinner"
              fullWidth
              margin="dense"
              value={newMeal.dinner}
              onChange={e => setNewMeal(prev => ({ ...prev, dinner: e.target.value }))}
              sx={textFieldSx}
            />

            <Typography variant="subtitle1" mt={2}>Ingredients</Typography>
            {newMeal.ingredients.map((ingredient, index) => (
              <Box key={index} display="flex" alignItems="center" gap={1} mt={1}>
                <TextField
                  label="Name"
                  value={ingredient.name}
                  onChange={e => handleIngredientChange(index, 'name', e.target.value)}
                  sx={{ flexGrow: 1 }}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Qty"
                  type="number"
                  value={ingredient.quantity}
                  onChange={e => handleIngredientChange(index, 'quantity', e.target.value)}
                  size="small"
                  inputProps={{ min: 1 }}
                  sx={{ width: 80 }}
                  InputLabelProps={{ shrink: true }}
                />
                <IconButton
                  aria-label="delete"
                  onClick={() => handleDeleteIngredient(index)}
                  size="small"
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddIngredient}
              sx={{ mt: 1 }}
              size="small"
            >
              Add Ingredient
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} sx={buttonStyle}>Cancel</Button>
            <Button
              onClick={handleSaveMeal}
              disabled={!newMeal.day.trim()}
              sx={{ ...buttonStyle, fontWeight: 'bold' }}
            >
              {isEditMode ? 'Save Changes' : 'Add Meal'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default MealPlanner;
