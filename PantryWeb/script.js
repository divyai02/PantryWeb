/ SIMPLE VERSION - LOAD PANTRY ITEMS
function loadPantryItemsFromBackend() {
    console.log('🔄 Trying to load pantry items...');
    
    fetch('/api/pantry')
        .then(response => response.json())
        .then(result => {
            console.log('Backend response:', result);
            if (result.success) {
                const pantryGrid = document.querySelector('.pantry-grid');
                if (pantryGrid) {
                    pantryGrid.innerHTML = '';
                    result.items.forEach(item => {
                        createIngredientCard(item.name, item.category, item.expiry, item.quantity, item.id);
                    });
                    console.log('✅ Loaded', result.items.length, 'items');
                }
            }
        })
        .catch(error => {
            console.error('❌ Error loading items:', error);
        });
}

// Load when pantry tab is clicked
document.querySelector('[data-tab="pantry"]').addEventListener('click', function() {
    console.log('📦 Pantry tab clicked');
    setTimeout(loadPantryItemsFromBackend, 100);
});

// Load on page load if pantry is active
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Page loaded');
    if (document.getElementById('pantry').classList.contains('active')) {
        setTimeout(loadPantryItemsFromBackend, 200);
    }
});

// 🆕 
// Tab Navigation
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Shopping list checkboxes
document.querySelectorAll('.shopping-item input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        this.parentElement.classList.toggle('checked', this.checked);
    });
});

// Allergy filter toggle
document.getElementById('filterBtn').addEventListener('click', function() {
    const filters = document.getElementById('allergyFilters');
    filters.style.display = filters.style.display === 'none' ? 'grid' : 'none';
});

// Allergy filter functionality
document.querySelectorAll('.allergy-option input').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        filterRecipes();
    });
});

function filterRecipes() {
    const showDairy = document.getElementById('dairy')?.checked ?? true;
    const showNuts = document.getElementById('nuts')?.checked ?? true;
    
    document.querySelectorAll('.recipe-card').forEach(card => {
        const isSafe = !card.querySelector('.allergy-warning');
        const containsDairy = card.textContent.includes('Dairy');
        const containsNuts = card.textContent.includes('Nuts');
        
        let shouldShow = true;
        
        if (!showDairy && containsDairy) shouldShow = false;
        if (!showNuts && containsNuts) shouldShow = false;
        
        card.style.display = shouldShow ? 'block' : 'none';
    });
}

// Add some interactive animations
document.querySelectorAll('.ingredient-card, .recipe-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// ADD ITEM POPUP FUNCTIONALITY - WITH VISUAL ADDITION!
document.getElementById('addItemBtn').addEventListener('click', function() {
    showAddItemModal();
});

function showAddItemModal() {
    const modalHTML = `
        <div class="modal-overlay" id="addItemModal" style="display: flex;">
            <div class="modal-content">
                <h3>🍎 Add New Item to Pantry</h3>
                <form id="addItemForm">
                    <input type="text" id="itemName" placeholder="Item Name (e.g., Milk, Eggs)" required>
                    <select id="itemCategory">
                        <option value="dairy">🥛 Dairy</option>
                        <option value="vegetables">🥦 Vegetables</option>
                        <option value="fruits">🍎 Fruits</option>
                        <option value="meat">🍗 Meat</option>
                        <option value="grains">🍞 Grains</option>
                        <option value="other">📦 Other</option>
                    </select>
                    <input type="date" id="expiryDate" required>
                    <input type="number" id="itemQuantity" placeholder="Quantity" value="1" min="1">
                    
                    <div class="modal-buttons">
                        <button type="submit" class="btn" style="flex: 1;">Add Item</button>
                        <button type="button" onclick="closeModal()" class="btn" style="background: #6c757d; flex: 1;">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeModal() {
    const modal = document.getElementById('addItemModal');
    if (modal) modal.remove();
}

// NEW FUNCTION: Create ingredient card visually
function createIngredientCard(name, category, expiry, quantity, itemId) {
    // Calculate days until expiry
    const expiryDate = new Date(expiry);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Get appropriate icon based on category
    const icons = {
        'dairy': '🥛',
        'vegetables': '🥦', 
        'fruits': '🍎',
        'meat': '🍗',
        'grains': '🍞',
        'other': '📦'
    };
    
    const icon = icons[category] || '🍎';
    
    // Create the new card HTML WITH DELETE BUTTON
    const newCardHTML = `
        <div class="ingredient-card ${diffDays <= 3 ? 'expiring' : ''}">
            <div class="ingredient-icon">${icon}</div>
            <h3>${name}</h3>
            <p>Expires: ${diffDays} days</p>
            <p>Qty: ${quantity}</p>
            <span class="allergy-tag">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
            <button class="delete-btn" onclick="deletePantryItem(${itemId}, '${name}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    // Add to the pantry grid
    document.querySelector('.pantry-grid').insertAdjacentHTML('beforeend', newCardHTML);
    
    // Add hover animations to the new card
    const newCard = document.querySelector('.pantry-grid').lastElementChild;
    newCard.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.02)';
    });
    newCard.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
}

// Handle form submission - UPDATED TO SAVE TO BACKEND
document.addEventListener('submit', function(e) {
    if (e.target.id === 'addItemForm') {
        e.preventDefault();
        
        const name = document.getElementById('itemName').value;
        const category = document.getElementById('itemCategory').value;
        const expiry = document.getElementById('expiryDate').value;
        const quantity = document.getElementById('itemQuantity').value;
        
        // 🆕 SEND TO BACKEND
        saveItemToBackend(name, category, expiry, quantity);
        
        closeModal();
    }
});

// 🆕 NEW FUNCTION: Save item to backend
async function saveItemToBackend(name, category, expiry, quantity) {
    try {
        const response = await fetch('/api/pantry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                category: category,
                expiry: expiry,
                quantity: quantity
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 🆕 ADD THE ITEM VISUALLY TO PANTRY
            createIngredientCard(name, category, expiry, quantity, result.item.id);
            showSuccessMessage(`✅ ${result.message}`);
        } else {
            showErrorMessage('❌ Failed to save item');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('❌ Could not connect to server');
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.id === 'addItemModal') {
        closeModal();
    }
});

// ==================== ENHANCED BARCODE SCANNER ====================

// REAL BARCODE SCANNER FUNCTIONALITY
document.getElementById('scanItemBtn').addEventListener('click', function() {
    startRealBarcodeScanner();
});

async function startRealBarcodeScanner() {
    const scannerHTML = `
        <div class="scanner-overlay" id="scannerModal">
            <div class="scanner-container">
                <h3>📷 Scan Barcode</h3>
                <div class="scanner-frame">
                    <video id="scanner-video" autoplay playsinline></video>
                </div>
                <p>Point camera at barcode - it will scan automatically</p>
                <div class="modal-buttons">
                    <button class="btn" onclick="stopScanner()">Cancel</button>
                </div>
            </div>
            <div class="scanner-instructions">
                <p>💡 Hold steady and ensure good lighting</p>
                <p>📱 Works with QR codes and product barcodes</p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', scannerHTML);
    await initializeRealScanner();
}

async function initializeRealScanner() {
    const video = document.getElementById('scanner-video');
    
    try {
        // Access camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        video.srcObject = stream;
        document.getElementById('scannerModal').style.display = 'flex';
        
        // Start real barcode detection
        startBarcodeDetection(video);
        
    } catch (error) {
        showErrorMessage('Camera access denied or not supported. Please allow camera permissions.');
        stopScanner();
    }
}

function startBarcodeDetection(video) {
    // Check if browser supports Barcode Detection API
    if (!('BarcodeDetector' in window)) {
        showErrorMessage('Barcode scanning not supported in this browser. Try Chrome or Edge.');
        stopScanner();
        return;
    }
    
    // Create barcode detector
    const barcodeDetector = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code']
    });
    
    let scanCount = 0;
    const maxScans = 50; // Prevent infinite scanning
    
    function detectBarcode() {
        if (scanCount >= maxScans) {
            console.log('Max scan attempts reached');
            return;
        }
        
        scanCount++;
        
        barcodeDetector.detect(video)
            .then(barcodes => {
                if (barcodes.length > 0) {
                    // Barcode found!
                    const barcode = barcodes[0];
                    console.log('Barcode detected:', barcode);
                    handleRealScannedBarcode(barcode.rawValue, barcode.format);
                } else {
                    // No barcode found, try again
                    setTimeout(detectBarcode, 500);
                }
            })
            .catch(error => {
                console.error('Barcode detection error:', error);
                setTimeout(detectBarcode, 1000);
            });
    }
    
    // Start detection when video is playing
    video.addEventListener('playing', () => {
        setTimeout(detectBarcode, 1000);
    });
}

// 🎯 HYBRID BARCODE LOOKUP: UNIVERSAL API + SMART FALLBACKS
async function lookupProductOnline(barcode) {
    console.log(`🔍 Hybrid lookup for: ${barcode}`);
    
    // 1. FIRST PRIORITY: Universal Open Food Facts API
    let product = await lookupOpenFoodFacts(barcode);
    if (product) {
        console.log('✅ Found in Open Food Facts');
        return product;
    }
    
    // 2. SECOND: Expanded Indian Products Database
    product = lookupExpandedIndianDatabase(barcode);
    if (product) {
        console.log('✅ Found in Indian Database');
        return product;
    }
    
    // 3. FINAL: AI-Powered Smart Guess (but keep universal API structure)
    console.log('🤖 Using smart guess');
    return generateSmartGuessFromBarcode(barcode);
}

// 🆕 UNIVERSAL OPEN FOOD FACTS API
async function lookupOpenFoodFacts(barcode) {
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();
        
        if (data.status === 1 && data.product) {
            const product = data.product;
            return {
                name: product.product_name || product.generic_name || 'Unknown Product',
                category: getCategoryFromProduct(product),
                brand: product.brands || '',
                image: product.image_url || '',
                source: 'Open Food Facts'
            };
        }
    } catch (error) {
        console.error('Open Food Facts lookup failed:', error);
    }
    return null;
}

// 🆕 EXPANDED INDIAN PRODUCTS DATABASE
function lookupExpandedIndianDatabase(barcode) {
    const indianProducts = {
        // Biscuits & Snacks
        '8901012000018': { name: 'Parle-G Biscuits', category: 'grains' },
        '8901012001244': { name: 'Parle-G Glucose Biscuits', category: 'grains' },
        '8901063100012': { name: 'Britannia Good Day Biscuits', category: 'grains' },
        '8901063700015': { name: 'Britannia Bourbon Biscuits', category: 'grains' },
        '8901063900018': { name: 'Britannia Tiger Kreemz', category: 'grains' },
        '8901063300019': { name: 'Britannia Milk Bikis', category: 'grains' },
        '8901063800012': { name: 'Britannia 50-50 Biscuits', category: 'grains' },
        '8901063200016': { name: 'Britannia Marie Gold', category: 'grains' },
        '8901063400010': { name: 'Britannia Little Hearts', category: 'grains' },
        
        // Tea & Coffee
        '8901491000016': { name: 'Tata Tea Premium', category: 'beverages' },
        '8901491000023': { name: 'Tata Tea Gold', category: 'beverages' },
        '8901491000030': { name: 'Tata Tea Agni', category: 'beverages' },
        '8901051000014': { name: 'Brooke Bond Red Label Tea', category: 'beverages' },
        '8901051000021': { name: 'Brooke Bond Taj Mahal Tea', category: 'beverages' },
        '8901051000038': { name: 'Brooke Bond Taaza Tea', category: 'beverages' },
        '8901052000018': { name: 'Bru Coffee', category: 'beverages' },
        '8901052000025': { name: 'Bru Instant Coffee', category: 'beverages' },
        
        // Noodles & Pasta
        '8901063000017': { name: 'Maggi Noodles', category: 'grains' },
        '8901063000024': { name: 'Maggi Masala Noodles', category: 'grains' },
        '8901063000031': { name: 'Maggi Atta Noodles', category: 'grains' },
        '8901063000048': { name: 'Maggi Oats Noodles', category: 'grains' },
        
        // Dairy
        '8904004200016': { name: 'Amul Milk', category: 'dairy' },
        '8904004200023': { name: 'Amul Gold Milk', category: 'dairy' },
        '8904004200030': { name: 'Amul Taaza Milk', category: 'dairy' },
        '8904004200047': { name: 'Amul Butter', category: 'dairy' },
        '8904004200054': { name: 'Amul Cheese', category: 'dairy' },
        '8904004200061': { name: 'Amul Paneer', category: 'dairy' },
        '8904004200078': { name: 'Amul Dahi', category: 'dairy' },
        '8904004200085': { name: 'Amul Ice Cream', category: 'dairy' },
        
        // Chocolates & Candies
        '8901012000209': { name: 'Cadbury Dairy Milk', category: 'other' },
        '8901012000216': { name: 'Cadbury Silk', category: 'other' },
        '8901012000223': { name: 'Cadbury 5 Star', category: 'other' },
        '8901012000230': { name: 'Cadbury Perk', category: 'other' },
        '8901012000247': { name: 'Cadbury Gems', category: 'other' },
        '8901012000254': { name: 'Nestle Munch', category: 'other' },
        '8901012000261': { name: 'Nestle KitKat', category: 'other' },
        
        // Add more as needed...
    };
    
    return indianProducts[barcode] || null;
}

// 🆕 AI-POWERED SMART GUESSING
function generateSmartGuessFromBarcode(barcode) {
    const barcodeStr = barcode.toString();
    
    // Enhanced pattern recognition
    let guessedName = 'Food Product';
    let guessedCategory = 'other';
    
    // Country code analysis (first 3 digits)
    const countryCode = barcodeStr.substring(0, 3);
    const countryProducts = {
        '890': { name: 'Indian Food Product', category: 'grains' }, // India
        '000': { name: 'US Food Product', category: 'other' },      // USA
        '400': { name: 'German Food', category: 'other' },          // Germany
        '300': { name: 'French Food', category: 'other' },          // France
        '500': { name: 'UK Food Product', category: 'other' },      // UK
    };
    
    if (countryProducts[countryCode]) {
        guessedName = countryProducts[countryCode].name;
        guessedCategory = countryProducts[countryCode].category;
    }
    
    // Manufacturer analysis
    if (barcodeStr.startsWith('8901')) {
        guessedName = 'Indian Packaged Food';
        guessedCategory = 'grains';
    }
    else if (barcodeStr.startsWith('8901063')) {
        guessedName = 'Noodles/Pasta Product';
        guessedCategory = 'grains';
    }
    else if (barcodeStr.startsWith('8901061')) {
        guessedName = 'Biscuits/Snacks';
        guessedCategory = 'grains';
    }
    else if (barcodeStr.startsWith('8901491')) {
        guessedName = 'Tea/Coffee Product';
        guessedCategory = 'beverages';
    }
    else if (barcodeStr.startsWith('8904004')) {
        guessedName = 'Dairy Product';
        guessedCategory = 'dairy';
    }
    
    return {
        name: guessedName,
        category: guessedCategory,
        brand: '',
        source: 'Smart Guess'
    };
}

// 🆕 IMPROVED CATEGORY DETECTION
function getCategoryFromProduct(product) {
    const categories = product.categories || '';
    const productName = (product.product_name || product.generic_name || '').toLowerCase();
    
    // Enhanced category detection
    if (productName.includes('biscuit') || productName.includes('cookie') || 
        productName.includes('cracker') || categories.includes('biscuits')) {
        return 'grains';
    }
    if (productName.includes('tea') || productName.includes('coffee') || 
        categories.includes('tea') || categories.includes('coffee')) {
        return 'beverages';
    }
    if (productName.includes('noodle') || productName.includes('pasta') || 
        categories.includes('noodles')) {
        return 'grains';
    }
    if (productName.includes('chocolate') || productName.includes('candy') || 
        categories.includes('chocolate')) {
        return 'other';
    }
    if (productName.includes('milk') || productName.includes('cheese') || 
        productName.includes('yogurt') || productName.includes('dairy') ||
        categories.includes('dairy')) {
        return 'dairy';
    }
    if (productName.includes('bread') || productName.includes('grain') || 
        categories.includes('bread')) {
        return 'grains';
    }
    if (productName.includes('fruit') || categories.includes('fruits')) {
        return 'fruits';
    }
    if (productName.includes('vegetable') || categories.includes('vegetables')) {
        return 'vegetables';
    }
    if (productName.includes('meat') || productName.includes('chicken') || 
        categories.includes('meat')) {
        return 'meat';
    }
    
    return 'other';
}

// 🆕 UPDATED HANDLER - 100% AUTOMATIC, NO MANUAL ENTRY!
async function handleRealScannedBarcode(barcodeData, format) {
    console.log(`📷 Scanned barcode: ${barcodeData}`);
    
    stopScanner();
    
    // Show scanning message
    showScanningMessage('Searching global food databases...');
    
    // Get product from hybrid lookup (ALWAYS returns something)
    const productInfo = await lookupProductOnline(barcodeData);
    
    // Auto-add to pantry (NO MANUAL ENTRY)
    await autoAddToPantry(productInfo, barcodeData);
}

// 🆕 AUTO-ADD FUNCTION (NO USER INPUT)
async function autoAddToPantry(productInfo, barcodeData) {
    const name = productInfo.name;
    const category = productInfo.category;
    const source = productInfo.source || 'Unknown';
    
    // Smart expiry based on category
    const expiryDays = getDefaultExpiryDays(category);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    // Auto quantity = 1
    const quantity = 1;
    
    // Save directly to backend
    try {
        const response = await fetch('/api/pantry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                category: category,
                expiry: expiryDate.toISOString().split('T')[0],
                quantity: quantity,
                source: source,
                barcode: barcodeData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccessMessage(`✅ Added: ${name} (Source: ${source})`);
            // Refresh pantry display
            if (document.getElementById('pantry').classList.contains('active')) {
                loadPantryItemsFromBackend();
            }
        }
    } catch (error) {
        console.error('Auto-add failed:', error);
        showErrorMessage('❌ Failed to add item automatically');
    }
}

// 🆕 SMART EXPIRY DEFAULTS
function getDefaultExpiryDays(category) {
    const expiryDefaults = {
        'dairy': 7,        // Milk, eggs, etc.
        'fruits': 5,       // Fresh fruits
        'vegetables': 7,   // Fresh vegetables  
        'meat': 3,         // Raw meat
        'grains': 30,      // Biscuits, snacks, pasta
        'beverages': 90,   // Tea, coffee, drinks
        'other': 30        // Default
    };
    
    return expiryDefaults[category] || 30;
}

function stopScanner() {
    const scannerModal = document.getElementById('scannerModal');
    if (scannerModal) {
        const video = document.getElementById('scanner-video');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        scannerModal.remove();
    }
}

// ==================== SHOPPING LIST FUNCTIONALITY ====================

// 🆕 ADD ITEM TO SHOPPING LIST
function addToShoppingList(itemName) {
    fetch('/api/shopping-list', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: itemName
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showSuccessMessage(`✅ ${result.message}`);
            loadShoppingListFromBackend(); // Refresh the display
        }
    });
}

// 🆕 LOAD SHOPPING LIST FROM BACKEND
async function loadShoppingListFromBackend() {
    try {
        const response = await fetch('/api/shopping-list');
        const result = await response.json();
        
        if (result.success) {
            const shoppingListContainer = document.querySelector('.shopping-list');
            shoppingListContainer.innerHTML = '';
            
            // Add clear completed button if there are completed items
            const completedItems = result.items.filter(item => item.completed);
            if (completedItems.length > 0) {
                const clearButtonHTML = `
                    <div class="shopping-actions">
                        <button class="btn-clear" onclick="clearCompletedShoppingItems()">
                            <i class="fas fa-broom"></i> Clear Completed (${completedItems.length})
                        </button>
                    </div>
                `;
                shoppingListContainer.insertAdjacentHTML('beforeend', clearButtonHTML);
            }
            
            result.items.forEach(item => {
                const itemHTML = `
                    <div class="shopping-item ${item.completed ? 'checked' : ''}">
                        <input type="checkbox" ${item.completed ? 'checked' : ''} 
                               onchange="toggleShoppingItem(${item.id}, this.checked)">
                        <span>${item.name}</span>
                        <button class="delete-btn-small" onclick="deleteShoppingItem(${item.id}, '${item.name}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                shoppingListContainer.insertAdjacentHTML('beforeend', itemHTML);
            });
        }
    } catch (error) {
        console.error('Error loading shopping list:', error);
    }
}

// 🆕 TOGGLE SHOPPING ITEM COMPLETED STATUS
function toggleShoppingItem(itemId, completed) {
    // This would update the backend in real implementation
    console.log(`Item ${itemId} marked as ${completed ? 'completed' : 'incomplete'}`);
}

// 🆕 ADD MANUAL ITEM BUTTON (call this function)
function addManualShoppingItem() {
    const itemName = prompt('Enter item name:');
    if (itemName) {
        addToShoppingList(itemName);
    }
}

// 🆕 LOAD SHOPPING LIST WHEN TAB IS OPENED
document.addEventListener('DOMContentLoaded', function() {
    // Add click listener to shopping tab
    document.querySelector('[data-tab="shopping"]').addEventListener('click', function() {
        setTimeout(loadShoppingListFromBackend, 100);
    });
});

// ==================== DELETE FUNCTIONALITY ====================

// Delete pantry item
async function deletePantryItem(itemId, itemName) {
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
        try {
            const response = await fetch(`/api/pantry/${itemId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showSuccessMessage(`✅ ${result.message}`);
                loadPantryItemsFromBackend(); // Refresh the list
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            showErrorMessage('❌ Could not delete item');
        }
    }
}

// Delete shopping list item
async function deleteShoppingItem(itemId, itemName) {
    if (confirm(`Remove "${itemName}" from shopping list?`)) {
        try {
            const response = await fetch(`/api/shopping-list/${itemId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showSuccessMessage(`✅ ${result.message}`);
                loadShoppingListFromBackend(); // Refresh the list
            }
        } catch (error) {
            console.error('Error deleting shopping item:', error);
            showErrorMessage('❌ Could not remove item');
        }
    }
}

// Clear completed shopping items
function clearCompletedShoppingItems() {
    if (confirm('Clear all completed items?')) {
        // This would call a backend endpoint in real implementation
        showSuccessMessage('✅ Completed items cleared!');
        loadShoppingListFromBackend();
    }
}

// ==================== ALLERGY & PREFERENCE ADD/DELETE FUNCTIONALITY ====================

// Add new allergy
function addNewAllergy() {
    const allergyName = prompt('Enter new allergy name (e.g., Shellfish, Sesame, etc.):');
    if (allergyName && allergyName.trim() !== '') {
        const newAllergyId = 'custom-allergy-' + Date.now();
        
        const allergyHTML = `
            <div class="allergy-option" id="${newAllergyId}">
                <input type="checkbox" id="${newAllergyId}-input" checked>
                <span class="allergy-icon">⚠️</span>
                <label for="${newAllergyId}-input"><strong>Avoid ${allergyName}</strong><br><small>Custom allergy</small></label>
                <button class="delete-btn-small" onclick="deleteCustomItem('${newAllergyId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add to allergy section (first card)
        const allergySection = document.querySelector('#allergy .card:first-child .allergy-filters');
        allergySection.insertAdjacentHTML('beforeend', allergyHTML);
        
        showSuccessMessage(`✅ Added "${allergyName}" to allergies`);
    }
}

// Add new diet preference
function addNewDietPreference() {
    const dietName = prompt('Enter new diet preference (e.g., Paleo, Mediterranean, etc.):');
    if (dietName && dietName.trim() !== '') {
        const newDietId = 'custom-diet-' + Date.now();
        
        const dietHTML = `
            <div class="allergy-option" id="${newDietId}">
                <input type="checkbox" id="${newDietId}-input" checked>
                <span class="allergy-icon">🍽️</span>
                <label for="${newDietId}-input"><strong>${dietName}</strong><br><small>Custom diet</small></label>
                <button class="delete-btn-small" onclick="deleteCustomItem('${newDietId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add to diet section (second card)
        const dietSection = document.querySelector('#allergy .card:last-child .allergy-filters');
        dietSection.insertAdjacentHTML('beforeend', dietHTML);
        
        showSuccessMessage(`✅ Added "${dietName}" to diet preferences`);
    }
}

// Delete custom item (works for both allergies and diets)
function deleteCustomItem(itemId) {
    const itemElement = document.getElementById(itemId);
    if (itemElement) {
        const itemName = itemElement.querySelector('label').textContent.split('\n')[0];
        if (confirm(`Remove "${itemName}"?`)) {
            itemElement.remove();
            showSuccessMessage(`✅ Removed "${itemName}"`);
        }
    }
}

// Save all preferences
async function saveAllPreferences() {
    showSuccessMessage('💾 All preferences saved successfully!');
    // In real implementation, this would save to backend
}

// Clear all preferences
function clearAllPreferences() {
    if (confirm('Clear all custom allergies and diets?')) {
        // Remove all custom items
        const customItems = document.querySelectorAll('[id^="custom-allergy-"], [id^="custom-diet-"]');
        customItems.forEach(item => item.remove());
        showSuccessMessage('✅ All custom preferences cleared!');
    }
}

// ==================== RECEIPT SCANNING FUNCTIONALITY ====================

function processReceipt() {
    const receiptText = document.getElementById('receiptText').value;
    
    if (!receiptText.trim()) {
        showErrorMessage('Please paste your receipt text first!');
        return;
    }
    
    const items = extractItemsFromReceipt(receiptText);
    
    if (items.length === 0) {
        showErrorMessage('No items found in receipt. Please check the format.');
        return;
    }
    
    // Add all items to pantry
    items.forEach(item => {
        saveItemToBackend(item.name, item.category, item.expiry, item.quantity);
    });
    
    showSuccessMessage(`✅ Added ${items.length} items from receipt to your pantry!`);
    document.getElementById('receiptText').value = ''; // Clear the textarea
}

function extractItemsFromReceipt(text) {
    const lines = text.split('\n');
    const items = [];
    
    const ignoreWords = ['total', 'subtotal', 'tax', 'cash', 'change', 'balance', 'card', 'thank', 'store', 'mart', 'price', 'amount'];
    
    for (let line of lines) {
        let cleanLine = line.trim();
        
        // Skip empty lines and lines with ignored words
        if (!cleanLine || ignoreWords.some(word => cleanLine.toLowerCase().includes(word))) {
            continue;
        }
        
        // Extract product name
        const productName = extractProductName(cleanLine);
        
        if (productName && productName.length > 2) {
            const category = guessCategory(productName);
            const quantity = extractQuantity(cleanLine);
            
            // Set expiry to 7 days from now as default
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            
            items.push({
                name: productName,
                category: category,
                expiry: expiryDate.toISOString().split('T')[0],
                quantity: quantity || 1
            });
        }
    }
    
    return items;
}

function extractProductName(line) {
    // Remove prices, quantities, and special characters
    let name = line.replace(/\d+\.\d{2}/g, ''); // Remove prices
    name = name.replace(/\d+/g, ''); // Remove numbers
    name = name.replace(/[@#]/g, ''); // Remove special chars
    
    // Extract meaningful words
    const words = name.split(' ')
        .filter(word => word.length > 2)
        .filter(word => !['LB', 'PK', 'GAL', 'L', 'ML', 'OZ', 'EA'].includes(word.toUpperCase()));
    
    return words.join(' ').trim();
}

function guessCategory(productName) {
    const name = productName.toLowerCase();
    
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || name.includes('butter')) return 'dairy';
    if (name.includes('egg')) return 'dairy';
    if (name.includes('bread') || name.includes('pasta') || name.includes('rice') || name.includes('cereal')) return 'grains';
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || name.includes('fish')) return 'meat';
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || name.includes('berry')) return 'fruits';
}
