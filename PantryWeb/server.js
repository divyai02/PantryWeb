const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== TEMPORARY STORAGE (No SQL yet) ====================

let pantryItems = [
    { id: 1, name: 'Milk', category: 'dairy', expiry: '2024-12-30', quantity: 1 },
    { id: 2, name: 'Eggs', category: 'dairy', expiry: '2024-12-28', quantity: 6 },
    { id: 3, name: 'Bread', category: 'grains', expiry: '2024-12-25', quantity: 1 }
];

let shoppingList = [
    { id: 1, name: 'Almond Milk', completed: false },
    { id: 2, name: 'Gluten-Free Bread', completed: true },
    { id: 3, name: 'Sunflower Seeds', completed: false }
];

let userPreferences = {
    allergies: ['dairy', 'nuts'],
    diets: ['vegetarian']  // 🟢 CHANGED: 'diet' to 'diets'
};

// ==================== PANTRY ITEMS API ====================

// Get all pantry items
app.get('/api/pantry', (req, res) => {
    res.json({
        success: true,
        message: 'Pantry items fetched successfully!',
        items: pantryItems
    });
});

// Add new pantry item
app.post('/api/pantry', (req, res) => {
    const { name, category, expiry, quantity } = req.body;
    
    console.log('📦 Adding item:', { name, category, expiry, quantity });
    
    // Create new item
    const newItem = {
        id: Date.now(), // Simple ID generation
        name,
        category, 
        expiry,
        quantity: parseInt(quantity) || 1
    };
    
    // Add to temporary storage
    pantryItems.push(newItem);
    
    res.json({
        success: true,
        message: `Item "${name}" added successfully!`,
        item: newItem
    });
});

// ==================== SHOPPING LIST API ====================

app.get('/api/shopping-list', (req, res) => {
    res.json({
        success: true,
        message: 'Shopping list fetched successfully!',
        items: shoppingList
    });
});

// Add to shopping list
app.post('/api/shopping-list', (req, res) => {
    const { name } = req.body;
    
    const newItem = {
        id: Date.now(),
        name,
        completed: false
    };
    
    shoppingList.push(newItem);
    
    res.json({
        success: true,
        message: `Added "${name}" to shopping list!`,
        item: newItem
    });
});

// ==================== USER PREFERENCES API ====================

app.get('/api/preferences', (req, res) => {
    res.json({
        success: true,
        preferences: userPreferences
    });
});

app.post('/api/preferences', (req, res) => {
    const { allergies, diets } = req.body;  // 🟢 CHANGED: 'diet' to 'diets'
    
    userPreferences = { 
        allergies: allergies || [], 
        diets: diets || []  // 🟢 CHANGED: 'diet' to 'diets'
    };
    
    console.log('💾 Saved preferences:', userPreferences);
    
    res.json({
        success: true,
        message: 'Preferences saved successfully!',
        preferences: userPreferences
    });
});

// ==================== BARCODE SCANNER API ====================

app.post('/api/scan-barcode', (req, res) => {
    const { barcode } = req.body;
    
    console.log('📷 Scanning barcode:', barcode);
    
    // Simulate barcode lookup
    const productDatabase = {
        '1234567890128': { name: 'Milk', category: 'dairy' },
        '2345678901231': { name: 'Eggs', category: 'dairy' },
        '3456789012344': { name: 'Bread', category: 'grains' },
        '4567890123457': { name: 'Tomatoes', category: 'vegetables' },
        '5678901234560': { name: 'Chicken', category: 'meat' }
    };
    
    const product = productDatabase[barcode];
    
    if (product) {
        res.json({
            success: true,
            product: product
        });
    } else {
        res.json({
            success: false,
            message: 'Product not found in database'
        });
    }
});

// ==================== RECIPES API ====================

app.get('/api/recipes', (req, res) => {
    // Simple recipe suggestions based on pantry items
    const recipes = [
        { 
            id: 1, 
            name: 'Pasta Primavera', 
            ingredients: ['Pasta', 'Tomatoes', 'Bell Peppers', 'Zucchini'],
            nutrition: { calories: 350, protein: 15, carbs: 45, fat: 12 }
        },
        { 
            id: 2, 
            name: 'Fresh Garden Salad', 
            ingredients: ['Lettuce', 'Tomatoes', 'Cucumber', 'Olive Oil'],
            nutrition: { calories: 280, protein: 8, carbs: 20, fat: 18 }
        }
    ];
    
    res.json({
        success: true,
        recipes: recipes
    });
});

// ==================== DELETE ENDPOINTS ====================

// Delete pantry item
app.delete('/api/pantry/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    
    console.log('🗑️ Deleting pantry item ID:', itemId);
    
    const initialLength = pantryItems.length;
    pantryItems = pantryItems.filter(item => item.id !== itemId);
    
    if (pantryItems.length < initialLength) {
        res.json({
            success: true,
            message: 'Item deleted successfully!'
        });
    } else {
        res.json({
            success: false,
            message: 'Item not found!'
        });
    }
});

// Delete shopping list item
app.delete('/api/shopping-list/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    
    console.log('🗑️ Deleting shopping item ID:', itemId);
    
    const initialLength = shoppingList.length;
    shoppingList = shoppingList.filter(item => item.id !== itemId);
    
    if (shoppingList.length < initialLength) {
        res.json({
            success: true,
            message: 'Item removed from shopping list!'
        });
    } else {
        res.json({
            success: false,
            message: 'Item not found!'
        });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Pantry API: /api/pantry`);
    console.log(`🛒 Shopping API: /api/shopping-list`);
    console.log(`⚡ Preferences API: /api/preferences`);
});
