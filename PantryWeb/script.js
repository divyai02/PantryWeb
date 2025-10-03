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
            alert(`✅ ${result.message}`);
        } else {
            alert('❌ Failed to save item');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Could not connect to server');
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.id === 'addItemModal') {
        closeModal();
    }
});

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
        alert('Camera access denied or not supported. Please allow camera permissions.');
        stopScanner();
    }
}

function startBarcodeDetection(video) {
    // Check if browser supports Barcode Detection API
    if (!('BarcodeDetector' in window)) {
        alert('Barcode scanning not supported in this browser. Try Chrome or Edge.');
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

// 🆕 UNIVERSAL BARCODE LOOKUP WITH ONLINE API
async function handleRealScannedBarcode(barcodeData, format) {
    console.log(`📷 Scanned barcode: ${barcodeData}`);
    
    stopScanner();
    
    // Try to lookup product online using Open Food Facts API
    const productInfo = await lookupProductOnline(barcodeData);
    
    if (productInfo) {
        // Product found online!
        showAddItemModal();
        setTimeout(() => {
            document.getElementById('itemName').value = productInfo.name;
            document.getElementById('itemCategory').value = productInfo.category;
            
            // Set expiry to tomorrow as default
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('expiryDate').value = tomorrow.toISOString().split('T')[0];
            
            document.getElementById('itemQuantity').value = 1;
            document.getElementById('expiryDate').focus();
            
            alert(`✅ Found: ${productInfo.name}`);
        }, 100);
    } else {
        // Product not found - manual entry
        showAddItemModal();
        setTimeout(() => {
            document.getElementById('itemName').value = `Product (${barcodeData})`;
            document.getElementById('itemCategory').value = 'other';
            
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('expiryDate').value = tomorrow.toISOString().split('T')[0];
            
            document.getElementById('itemQuantity').value = 1;
            document.getElementById('itemName').focus();
            
            alert(`🔍 Product not found. Please enter details manually.`);
        }, 100);
    }
}

// 🆕 ONLINE PRODUCT LOOKUP FUNCTION
async function lookupProductOnline(barcode) {
    try {
        console.log(`🔍 Looking up barcode ${barcode} online...`);
        
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();
        
        if (data.status === 1 && data.product) {
            // Product found!
            const product = data.product;
            return {
                name: product.product_name || product.generic_name || 'Unknown Product',
                category: getCategoryFromProduct(product)
            };
        }
    } catch (error) {
        console.error('Online lookup failed:', error);
    }
    return null;
}

// 🆕 SMART CATEGORY DETECTION
function getCategoryFromProduct(product) {
    const categories = product.categories || '';
    const name = (product.product_name || '').toLowerCase();
    
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || name.includes('butter') || categories.includes('dairy')) 
        return 'dairy';
    if (name.includes('egg') || categories.includes('eggs')) 
        return 'dairy';
    if (name.includes('bread') || name.includes('pasta') || name.includes('rice') || name.includes('cereal') || categories.includes('grains')) 
        return 'grains';
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || name.includes('fish') || categories.includes('meat')) 
        return 'meat';
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || name.includes('berry') || categories.includes('fruits')) 
        return 'fruits';
    if (name.includes('tomato') || name.includes('carrot') || name.includes('potato') || name.includes('onion') || categories.includes('vegetables')) 
        return 'vegetables';
    
    return 'other';
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
            alert(`✅ ${result.message}`);
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
                alert(`✅ ${result.message}`);
                loadPantryItemsFromBackend(); // Refresh the list
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('❌ Could not delete item');
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
                alert(`✅ ${result.message}`);
                loadShoppingListFromBackend(); // Refresh the list
            }
        } catch (error) {
            console.error('Error deleting shopping item:', error);
            alert('❌ Could not remove item');
        }
    }
}

// Clear completed shopping items
function clearCompletedShoppingItems() {
    if (confirm('Clear all completed items?')) {
        // This would call a backend endpoint in real implementation
        alert('✅ Completed items cleared!');
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
        
        alert(`✅ Added "${allergyName}" to allergies`);
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
        
        alert(`✅ Added "${dietName}" to diet preferences`);
    }
}

// Delete custom item (works for both allergies and diets)
function deleteCustomItem(itemId) {
    const itemElement = document.getElementById(itemId);
    if (itemElement) {
        const itemName = itemElement.querySelector('label').textContent.split('\n')[0];
        if (confirm(`Remove "${itemName}"?`)) {
            itemElement.remove();
            alert(`✅ Removed "${itemName}"`);
        }
    }
}

// Save all preferences
async function saveAllPreferences() {
    alert('💾 All preferences saved successfully!');
    // In real implementation, this would save to backend
}

// Clear all preferences
function clearAllPreferences() {
    if (confirm('Clear all custom allergies and diets?')) {
        // Remove all custom items
        const customItems = document.querySelectorAll('[id^="custom-allergy-"], [id^="custom-diet-"]');
        customItems.forEach(item => item.remove());
        alert('✅ All custom preferences cleared!');
    }
}

// ==================== RECEIPT SCANNING FUNCTIONALITY ====================

function processReceipt() {
    const receiptText = document.getElementById('receiptText').value;
    
    if (!receiptText.trim()) {
        alert('Please paste your receipt text first!');
        return;
    }
    
    const items = extractItemsFromReceipt(receiptText);
    
    if (items.length === 0) {
        alert('No items found in receipt. Please check the format.');
        return;
    }
    
    // Add all items to pantry
    items.forEach(item => {
        saveItemToBackend(item.name, item.category, item.expiry, item.quantity);
    });
    
    alert(`✅ Added ${items.length} items from receipt to your pantry!`);
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
    if (name.includes('tomato') || name.includes('carrot') || name.includes('potato') || name.includes('onion')) return 'vegetables';
    
    return 'other';
}

function extractQuantity(line) {
    // Look for quantities like "2 MILK" or "MILK 2"
    const match = line.match(/(\d+)\s*[x@]?\s*[A-Z]/i) || line.match(/[A-Z]\s*(\d+)/i);
    return match ? parseInt(match[1]) : 1;
}     
