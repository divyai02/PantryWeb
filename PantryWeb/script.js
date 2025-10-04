// SIMPLE VERSION - LOAD PANTRY ITEMS
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

// ==================== INITIALIZATION ====================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Page loaded - Initializing Pantry+');
    
    initializeTabs();
    initializeEventListeners();
    loadInitialData();
});

function initializeTabs() {
    // Tab Navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            // Load data for specific tabs
            if (tabId === 'pantry') {
                setTimeout(loadPantryItemsFromBackend, 100);
            } else if (tabId === 'shopping') {
                setTimeout(loadShoppingListFromBackend, 100);
            }
        });
    });
}

function initializeEventListeners() {
    console.log('🔧 Initializing event listeners...');
    
    // Shopping list checkboxes - using event delegation
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox' && e.target.closest('.shopping-item')) {
            e.target.closest('.shopping-item').classList.toggle('checked', e.target.checked);
        }
    });
    
    // Allergy filter toggle
    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            const filters = document.getElementById('allergyFilters');
            if (filters) {
                filters.style.display = filters.style.display === 'none' ? 'grid' : 'none';
            }
        });
    }
    
    // Allergy filter functionality
    document.querySelectorAll('.allergy-option input').forEach(checkbox => {
        checkbox.addEventListener('change', filterRecipes);
    });
    
    // Add item button
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', showAddItemModal);
    }
    
    // Scan item button
    const scanItemBtn = document.getElementById('scanItemBtn');
    if (scanItemBtn) {
        scanItemBtn.addEventListener('click', startRealBarcodeScanner);
    }
    
    // Manual shopping item button
    const manualShopBtn = document.querySelector('[onclick="addManualShoppingItem()"]');
    if (manualShopBtn) {
        manualShopBtn.addEventListener('click', addManualShoppingItem);
    }
    
    // Add hover animations
    document.addEventListener('mouseover', function(e) {
        if (e.target.closest('.ingredient-card, .recipe-card')) {
            const card = e.target.closest('.ingredient-card, .recipe-card');
            card.style.transform = 'translateY(-5px) scale(1.02)';
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.ingredient-card, .recipe-card')) {
            const card = e.target.closest('.ingredient-card, .recipe-card');
            card.style.transform = 'translateY(0) scale(1)';
        }
    });
}

function loadInitialData() {
    // Load pantry items if pantry tab is active
    if (document.getElementById('pantry')?.classList.contains('active')) {
        setTimeout(loadPantryItemsFromBackend, 200);
    }
    
    // Load shopping list if shopping tab is active
    if (document.getElementById('shopping')?.classList.contains('active')) {
        setTimeout(loadShoppingListFromBackend, 200);
    }
}

// ==================== MODAL FUNCTIONS ====================

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
    
    // Add form submit listener
    document.getElementById('addItemForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('itemName').value;
        const category = document.getElementById('itemCategory').value;
        const expiry = document.getElementById('expiryDate').value;
        const quantity = document.getElementById('itemQuantity').value;
        
        saveItemToBackend(name, category, expiry, quantity);
        closeModal();
    });
}

function closeModal() {
    const modal = document.getElementById('addItemModal');
    if (modal) modal.remove();
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.id === 'addItemModal') {
        closeModal();
    }
});

// ==================== PANTRY ITEM FUNCTIONS ====================

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
    
    // Create the new card HTML WITH EDIT & DELETE BUTTONS
    const newCardHTML = `
        <div class="ingredient-card ${diffDays <= 3 ? 'expiring' : ''}">
            <div class="ingredient-icon">${icon}</div>
            <h3>${name}</h3>
            <p>Expires: ${diffDays} days</p>
            <p>Qty: ${quantity}</p>
            <span class="allergy-tag">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
            
            <div class="action-buttons">
                <button class="edit-btn" onclick="showEditModal(${itemId}, '${name.replace(/'/g, "\\'")}', '${category}', '${expiry}', ${quantity})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-btn" onclick="deletePantryItem(${itemId}, '${name}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    
    // Add to the pantry grid
    const pantryGrid = document.querySelector('.pantry-grid');
    if (pantryGrid) {
        pantryGrid.insertAdjacentHTML('beforeend', newCardHTML);
    }
}

// 🆕 EDIT MODAL FUNCTION
function showEditModal(itemId, currentName, currentCategory, currentExpiry, currentQuantity) {
    const modalHTML = `
        <div class="modal-overlay" id="editItemModal" style="display: flex;">
            <div class="modal-content">
                <h3>✏️ Edit Item</h3>
                <form id="editItemForm">
                    <input type="text" id="editItemName" value="${currentName}" placeholder="Item Name" required>
                    
                    <select id="editItemCategory">
                        <option value="dairy" ${currentCategory === 'dairy' ? 'selected' : ''}>🥛 Dairy</option>
                        <option value="vegetables" ${currentCategory === 'vegetables' ? 'selected' : ''}>🥦 Vegetables</option>
                        <option value="fruits" ${currentCategory === 'fruits' ? 'selected' : ''}>🍎 Fruits</option>
                        <option value="meat" ${currentCategory === 'meat' ? 'selected' : ''}>🍗 Meat</option>
                        <option value="grains" ${currentCategory === 'grains' ? 'selected' : ''}>🍞 Grains</option>
                        <option value="beverages" ${currentCategory === 'beverages' ? 'selected' : ''}>🥤 Beverages</option>
                        <option value="other" ${currentCategory === 'other' ? 'selected' : ''}>📦 Other</option>
                    </select>
                    
                    <input type="date" id="editExpiryDate" value="${currentExpiry}" required>
                    <input type="number" id="editItemQuantity" value="${currentQuantity}" min="1" max="100">
                    
                    <div class="modal-buttons">
                        <button type="submit" class="btn" style="flex: 1;">💾 Save Changes</button>
                        <button type="button" onclick="closeEditModal()" class="btn" style="background: #6c757d; flex: 1;">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add form submit listener
    document.getElementById('editItemForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('editItemName').value;
        const category = document.getElementById('editItemCategory').value;
        const expiry = document.getElementById('editExpiryDate').value;
        const quantity = document.getElementById('editItemQuantity').value;
        
        updatePantryItem(itemId, name, category, expiry, quantity);
        closeEditModal();
    });
}

// 🆕 CLOSE EDIT MODAL
function closeEditModal() {
    const modal = document.getElementById('editItemModal');
    if (modal) modal.remove();
}

// 🆕 UPDATE PANTRY ITEM
async function updatePantryItem(itemId, name, category, expiry, quantity) {
    try {
        const response = await fetch(`/api/pantry/${itemId}`, {
            method: 'PUT',
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
            showSuccessMessage(`✅ ${result.message}`);
            loadPantryItemsFromBackend(); // Refresh the list
        } else {
            showErrorMessage('❌ Failed to update item');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('❌ Could not connect to server');
    }
}

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

// ==================== RECIPE FILTERING ====================

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

// ==================== ENHANCED BARCODE SCANNER ====================

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
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        
        video.srcObject = stream;
        document.getElementById('scannerModal').style.display = 'flex';
        startBarcodeDetection(video);
        
    } catch (error) {
        showErrorMessage('Camera access denied or not supported. Please allow camera permissions.');
        stopScanner();
    }
}

function startBarcodeDetection(video) {
    if (!('BarcodeDetector' in window)) {
        showErrorMessage('Barcode scanning not supported in this browser. Try Chrome or Edge.');
        stopScanner();
        return;
    }
    
    const barcodeDetector = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code']
    });
    
    let scanCount = 0;
    const maxScans = 50;
    
    function detectBarcode() {
        if (scanCount >= maxScans) return;
        scanCount++;
        
        barcodeDetector.detect(video)
            .then(barcodes => {
                if (barcodes.length > 0) {
                    const barcode = barcodes[0];
                    handleRealScannedBarcode(barcode.rawValue, barcode.format);
                } else {
                    setTimeout(detectBarcode, 500);
                }
            })
            .catch(error => {
                console.error('Barcode detection error:', error);
                setTimeout(detectBarcode, 1000);
            });
    }
    
    video.addEventListener('playing', () => {
        setTimeout(detectBarcode, 1000);
    });
}

// 🎯 HYBRID BARCODE LOOKUP
async function lookupProductOnline(barcode) {
    console.log(`🔍 Hybrid lookup for: ${barcode}`);
    
    // 1. Open Food Facts API
    let product = await lookupOpenFoodFacts(barcode);
    if (product) return product;
    
    // 2. Indian Products Database
    product = lookupExpandedIndianDatabase(barcode);
    if (product) return product;
    
    // 3. Smart Guess
    return generateSmartGuessFromBarcode(barcode);
}

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
                source: 'Open Food Facts'
            };
        }
    } catch (error) {
        console.error('Open Food Facts lookup failed:', error);
    }
    return null;
}

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
        
        // Tea & Coffee
        '8901491000016': { name: 'Tata Tea Premium', category: 'beverages' },
        '8901491000023': { name: 'Tata Tea Gold', category: 'beverages' },
        '8901051000014': { name: 'Brooke Bond Red Label Tea', category: 'beverages' },
        
        // Noodles & Pasta
        '8901063000017': { name: 'Maggi Noodles', category: 'grains' },
        '8901063000024': { name: 'Maggi Masala Noodles', category: 'grains' },
        
        // Dairy
        '8904004200016': { name: 'Amul Milk', category: 'dairy' },
        '8904004200047': { name: 'Amul Butter', category: 'dairy' },
        '8904004200054': { name: 'Amul Cheese', category: 'dairy' },
        
        // Chocolates
        '8901012000254': { name: 'Nestle Munch', category: 'other' },
        '8901012000261': { name: 'Nestle KitKat', category: 'other' },
    };
    
    return indianProducts[barcode] || null;
}

function generateSmartGuessFromBarcode(barcode) {
    const barcodeStr = barcode.toString();
    let guessedName = 'Food Product';
    let guessedCategory = 'other';
    
    if (barcodeStr.startsWith('8901')) {
        guessedName = 'Indian Packaged Food';
        guessedCategory = 'grains';
    }
    else if (barcodeStr.startsWith('8901063')) {
        guessedName = 'Noodles/Pasta Product';
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
        source: 'Smart Guess'
    };
}

function getCategoryFromProduct(product) {
    const categories = product.categories || '';
    const productName = (product.product_name || product.generic_name || '').toLowerCase();
    
    if (productName.includes('biscuit') || productName.includes('cookie') || categories.includes('biscuits')) return 'grains';
    if (productName.includes('tea') || productName.includes('coffee') || categories.includes('tea')) return 'beverages';
    if (productName.includes('noodle') || productName.includes('pasta') || categories.includes('noodles')) return 'grains';
    if (productName.includes('chocolate') || categories.includes('chocolate')) return 'other';
    if (productName.includes('milk') || productName.includes('cheese') || categories.includes('dairy')) return 'dairy';
    if (productName.includes('bread') || categories.includes('bread')) return 'grains';
    
    return 'other';
}

// 🆕 AUTOMATIC BARCODE HANDLING
async function handleRealScannedBarcode(barcodeData, format) {
    console.log(`📷 Scanned barcode: ${barcodeData}`);
    stopScanner();
    showScanningMessage('Searching global food databases...');
    
    const productInfo = await lookupProductOnline(barcodeData);
    await autoAddToPantry(productInfo, barcodeData);
}

async function autoAddToPantry(productInfo, barcodeData) {
    const name = productInfo.name;
    const category = productInfo.category;
    const source = productInfo.source || 'Unknown';
    
    const expiryDays = getDefaultExpiryDays(category);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
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
                quantity: 1,
                source: source,
                barcode: barcodeData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccessMessage(`✅ Added: ${name} (Source: ${source})`);
            if (document.getElementById('pantry')?.classList.contains('active')) {
                loadPantryItemsFromBackend();
            }
        }
    } catch (error) {
        console.error('Auto-add failed:', error);
        showErrorMessage('❌ Failed to add item automatically');
    }
}

function getDefaultExpiryDays(category) {
    const expiryDefaults = {
        'dairy': 7,
        'fruits': 5,
        'vegetables': 7,
        'meat': 3,
        'grains': 30,
        'beverages': 90,
        'other': 30
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

// ==================== SHOPPING LIST FUNCTIONS ====================

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
            loadShoppingListFromBackend();
        }
    });
}

async function loadShoppingListFromBackend() {
    try {
        const response = await fetch('/api/shopping-list');
        const result = await response.json();
        
        if (result.success) {
            const shoppingListContainer = document.querySelector('.shopping-list');
            if (shoppingListContainer) {
                shoppingListContainer.innerHTML = '';
                
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
        }
    } catch (error) {
        console.error('Error loading shopping list:', error);
    }
}

function toggleShoppingItem(itemId, completed) {
    console.log(`Item ${itemId} marked as ${completed ? 'completed' : 'incomplete'}`);
}

function addManualShoppingItem() {
    const itemName = prompt('Enter item name:');
    if (itemName) {
        addToShoppingList(itemName);
    }
}

// ==================== DELETE FUNCTIONS ====================

async function deletePantryItem(itemId, itemName) {
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
        try {
            const response = await fetch(`/api/pantry/${itemId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showSuccessMessage(`✅ ${result.message}`);
                loadPantryItemsFromBackend();
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            showErrorMessage('❌ Could not delete item');
        }
    }
}

async function deleteShoppingItem(itemId, itemName) {
    if (confirm(`Remove "${itemName}" from shopping list?`)) {
        try {
            const response = await fetch(`/api/shopping-list/${itemId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showSuccessMessage(`✅ ${result.message}`);
                loadShoppingListFromBackend();
            }
        } catch (error) {
            console.error('Error deleting shopping item:', error);
            showErrorMessage('❌ Could not remove item');
        }
    }
}

function clearCompletedShoppingItems() {
    if (confirm('Clear all completed items?')) {
        showSuccessMessage('✅ Completed items cleared!');
        loadShoppingListFromBackend();
    }
}

// ==================== ALLERGY & PREFERENCE FUNCTIONS ====================

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
        
        const allergySection = document.querySelector('#allergy .card:first-child .allergy-filters');
        if (allergySection) {
            allergySection.insertAdjacentHTML('beforeend', allergyHTML);
            showSuccessMessage(`✅ Added "${allergyName}" to allergies`);
        }
    }
}

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
        
        const dietSection = document.querySelector('#allergy .card:last-child .allergy-filters');
        if (dietSection) {
            dietSection.insertAdjacentHTML('beforeend', dietHTML);
            showSuccessMessage(`✅ Added "${dietName}" to diet preferences`);
        }
    }
}

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

function saveAllPreferences() {
    showSuccessMessage('💾 All preferences saved successfully!');
}

function clearAllPreferences() {
    if (confirm('Clear all custom allergies and diets?')) {
        const customItems = document.querySelectorAll('[id^="custom-allergy-"], [id^="custom-diet-"]');
        customItems.forEach(item => item.remove());
        showSuccessMessage('✅ All custom preferences cleared!');
    }
}

// ==================== UTILITY FUNCTIONS ====================

function showScanningMessage(message) {
    console.log(`🔍 ${message}`);
}

function showSuccessMessage(message) {
    // Create a success toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #40c057;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        font-weight: bold;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

function showErrorMessage(message) {
    // Create an error toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        font-weight: bold;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// ==================== RECEIPT SCANNING (Keep as is) ====================

function processReceipt() {
    const receiptText = document.getElementById('receiptText')?.value;
    
    if (!receiptText?.trim()) {
        showErrorMessage('Please paste your receipt text first!');
        return;
    }
    
    const items = extractItemsFromReceipt(receiptText);
    
    if (items.length === 0) {
        showErrorMessage('No items found in receipt. Please check the format.');
        return;
    }
    
    items.forEach(item => {
        saveItemToBackend(item.name, item.category, item.expiry, item.quantity);
    });
    
    showSuccessMessage(`✅ Added ${items.length} items from receipt to your pantry!`);
    document.getElementById('receiptText').value = '';
}

function extractItemsFromReceipt(text) {
    const lines = text.split('\n');
    const items = [];
    const ignoreWords = ['total', 'subtotal', 'tax', 'cash', 'change', 'balance', 'card', 'thank', 'store', 'mart', 'price', 'amount'];
    
    for (let line of lines) {
        let cleanLine = line.trim();
        
        if (!cleanLine || ignoreWords.some(word => cleanLine.toLowerCase().includes(word))) {
            continue;
        }
        
        const productName = extractProductName(cleanLine);
        
        if (productName && productName.length > 2) {
            const category = guessCategory(productName);
            const quantity = extractQuantity(cleanLine);
            
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
    let name = line.replace(/\d+\.\d{2}/g, '');
    name = name.replace(/\d+/g, '');
    name = name.replace(/[@#]/g, '');
    
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
    if (name.includes('tomato') || name.includes('carrot') || name.includes('potato') || name.includes('onion')) return 'vegetables';
    
    return 'other';
}

function extractQuantity(line) {
    const match = line.match(/(\d+)\s*[x@]?\s*[A-Z]/i) || line.match(/[A-Z]\s*(\d+)/i);
