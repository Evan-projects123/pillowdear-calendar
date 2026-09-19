/* 
  State Management 
*/
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11
let calendarData = {}; 
let activeClipboardImage = null; 

// Global variables for Firefox compatibility
let targetDateKey = null;
let targetDayBox = null;
let imageInput = null; 

// Year scroller config
const YEAR_RANGE_START = new Date().getFullYear() - 10;
const YEAR_RANGE_END = new Date().getFullYear() + 10;
const YEAR_ITEM_HEIGHT = 40; 

const grid = document.getElementById('calendarGrid');
const yearBtn = document.getElementById('yearBtn');
const yearScroller = document.getElementById('yearScroller');
const monthDisplay = document.getElementById('monthDisplay');
const yearDropdown = document.getElementById('yearDropdown');
const fileInput = document.getElementById('fileInput');

// --- Initialization ---

function init() {
    // Setup persistent global image input to satisfy Firefox's security rules
    imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    imageInput.style.display = 'none';
    
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !targetDayBox) return;

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            activeClipboardImage = readerEvent.target.result;
            applyImageToBox(targetDateKey, targetDayBox, activeClipboardImage);
        };
        reader.readAsDataURL(file);
        imageInput.value = ''; // Reset so the same file can be chosen again later
    });
    document.body.appendChild(imageInput);

    // Populate the scroller
    for (let y = YEAR_RANGE_START; y <= YEAR_RANGE_END; y++) {
        const span = document.createElement('span');
        span.textContent = y;
        span.dataset.year = y; 
        yearScroller.appendChild(span);
    }
    
    yearScroller.style.transition = 'none';
    updateYearScroller(false);
    
    requestAnimationFrame(() => {
        yearScroller.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    });

    renderCalendar(false);     
    populateYearDropdown();
    setupEventListeners();
}

// --- Calendar Rendering & Animation ---

function renderCalendar(animate = true, direction = 'next') {
    const newGrid = document.createElement('div');
    newGrid.className = 'calendar-grid';
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthDisplay.textContent = monthNames[currentMonth];

    if (!calendarData[currentYear]) calendarData[currentYear] = {};
    if (!calendarData[currentYear][currentMonth]) calendarData[currentYear][currentMonth] = {};

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyBox = document.createElement('div');
        emptyBox.className = 'day-box empty';
        newGrid.appendChild(emptyBox);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayBox = document.createElement('div');
        dayBox.className = 'day-box';
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayBox.dataset.dateKey = dateKey;

        const label = document.createElement('span');
        label.className = 'day-number';
        label.textContent = day;
        dayBox.appendChild(label);

        const imageData = calendarData[currentYear][currentMonth][dateKey];
        if (imageData) {
            dayBox.style.backgroundImage = `url('${imageData}')`;
            label.style.opacity = '0.5'; 
        }

        // NOTE: click listeners are handled via event delegation in setupEventListeners()
        newGrid.appendChild(dayBox);
    }

    const totalSlots = firstDayIndex + daysInMonth;
    const remainder = totalSlots % 7;
    if (remainder > 0) {
        const padding = 7 - remainder;
        for (let i = 0; i < padding; i++) {
            const emptyBox = document.createElement('div');
            emptyBox.className = 'day-box empty';
            newGrid.appendChild(emptyBox);
        }
    }

    if (animate && grid.children.length > 0) {
        const oldGrid = grid.cloneNode(true);
        oldGrid.className = 'calendar-grid';
        oldGrid.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');
        
        grid.parentNode.insertBefore(oldGrid, grid);
        grid.innerHTML = newGrid.innerHTML;
        
        grid.className = 'calendar-grid';
        void grid.offsetWidth;
        grid.className = `calendar-grid ${direction === 'next' ? 'slide-in-right' : 'slide-in-left'}`;
        
        setTimeout(() => {
            if (oldGrid.parentNode) oldGrid.parentNode.removeChild(oldGrid);
        }, 800);
        
    } else {
        grid.innerHTML = newGrid.innerHTML;
        grid.className = 'calendar-grid';
    }
}

// --- Image Handling & Animations ---

function handleDayClick(event, dateKey, targetBox) {
    // Check if user is holding Shift to quickly paste the last image
    if (event.shiftKey && activeClipboardImage) {
        applyImageToBox(dateKey, targetBox, activeClipboardImage);
        return;
    }

    // Otherwise, prep global variables and trigger immediate upload
    targetDateKey = dateKey;
    targetDayBox = targetBox;
    imageInput.click();
}

function applyImageToBox(dateKey, targetBox, base64Image) {
    calendarData[currentYear][currentMonth][dateKey] = base64Image;

    const rect = targetBox.getBoundingClientRect();
    const flyingImg = document.createElement('img');
    flyingImg.src = base64Image;
    flyingImg.style.position = 'fixed';
    flyingImg.style.zIndex = '9999';
    flyingImg.style.objectFit = 'cover';
    flyingImg.style.borderRadius = '8px';
    flyingImg.style.pointerEvents = 'none';
    
    flyingImg.style.top = '0';
    flyingImg.style.left = '0';
    flyingImg.style.width = '100vw';
    flyingImg.style.height = '100vh';
    flyingImg.style.transition = 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
    
    document.body.appendChild(flyingImg);

    requestAnimationFrame(() => {
        flyingImg.style.top = `${rect.top}px`;
        flyingImg.style.left = `${rect.left}px`;
        flyingImg.style.width = `${rect.width}px`;
        flyingImg.style.height = `${rect.height}px`;
    });

    setTimeout(() => {
        targetBox.style.backgroundImage = `url('${base64Image}')`;
        const label = targetBox.querySelector('.day-number');
        if (label) label.style.opacity = '0.5';
        
        flyingImg.remove();
        
        targetBox.classList.add('shake');
        setTimeout(() => targetBox.classList.remove('shake'), 400);
    }, 600);
}

// --- Controls & Logic ---

function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
            updateYearScroller(true);
        }
        renderCalendar(true, 'prev');
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
            updateYearScroller(true);
        }
        renderCalendar(true, 'next');
    });

    yearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        yearDropdown.classList.toggle('show');
    });

    window.addEventListener('click', () => {
        if (yearDropdown.classList.contains('show')) {
            yearDropdown.classList.remove('show');
        }
    });

    document.getElementById('saveBtn').addEventListener('click', saveData);
    document.getElementById('loadBtn').addEventListener('click', () => fileInput.click());
    document.getElementById('exportBtn').addEventListener('click', exportMonthAsPNG);
    fileInput.addEventListener('change', loadData);

    // --- Event delegation for day boxes ---
    // Single listener on the persistent #calendarGrid container.
    // Since only grid.innerHTML is replaced during renders, this listener
    // survives every re-render and reaches all current day boxes.
    grid.addEventListener('click', (e) => {
        const box = e.target.closest('.day-box');
        if (!box || box.classList.contains('empty') || !box.dataset.dateKey) return;
        handleDayClick(e, box.dataset.dateKey, box);
    });
}

// --- Year Scroller Logic ---

function updateYearScroller(animate = true) {
    const index = currentYear - YEAR_RANGE_START;
    
    if (!animate) {
        yearScroller.style.transition = 'none';
    } else {
        yearScroller.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    }
    
    yearScroller.style.transform = `translateY(-${index * YEAR_ITEM_HEIGHT}px)`;
}

function populateYearDropdown() {
    yearDropdown.innerHTML = '';
    for (let y = YEAR_RANGE_START; y <= YEAR_RANGE_END; y++) {
        const link = document.createElement('a');
        link.textContent = y;
        link.href = '#';
        link.onclick = (e) => {
            e.preventDefault();
            const oldYear = currentYear;
            currentYear = y;
            
            const direction = y > oldYear ? 'next' : 'prev';
            
            updateYearScroller(true);
            renderCalendar(true, direction);
            yearDropdown.classList.remove('show');
        };
        yearDropdown.appendChild(link);
    }
}

// --- File System (Save/Load) ---

async function saveData() {
    const dataStr = JSON.stringify(calendarData);
    const blob = new Blob([dataStr], { type: "application/json" });

    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: `asmr_calendar_${currentYear}.json`,
                types: [{ description: 'JSON File', accept: {'application/json': ['.json']} }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (err) { console.error("Save cancelled", err); }
    } 

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asmr_calendar_${currentYear}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const loadedData = JSON.parse(event.target.result);
            if (typeof loadedData === 'object') {
                calendarData = loadedData;
                renderCalendar(false);
                alert("ASMR Calendar loaded successfully!");
            }
        } catch (err) {
            alert("Error parsing file.");
        }
    };
    reader.readAsText(file);
    fileInput.value = '';
}

// --- PNG Export ---

// Shared helper: wrap an image load in a promise so we can await it.
// ctx.drawImage requires a fully decoded image, so every background
// image must be loaded before we start drawing.
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = src;
    });
}

// Shared helper: take a Blob and a filename, use the File System Access API
// if available, otherwise fall back to a download link. Mirrors the logic
// in saveData() so both save paths behave consistently.
async function saveBlob(blob, filename, description, accept) {
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{ description, accept }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (err) {
            // User cancelled — bail silently, same as saveData()
            if (err.name === 'AbortError') return;
            console.error('Save failed', err);
        }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Main export: re-draws the current month onto a canvas at 2x scale and
// saves it as a PNG. This does NOT screenshot the DOM — it reads from
// calendarData and redraws. If you change how the grid looks in CSS,
// update the drawing constants below to match.
async function exportMonthAsPNG() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    const monthLabel = `${monthNames[currentMonth]} ${currentYear}`;

    const monthData = (calendarData[currentYear] && calendarData[currentYear][currentMonth]) || {};
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    // --- Geometry (all in CSS pixels, then scaled by DPR-ish factor) ---
    const SCALE = 2;
    const CANVAS_WIDTH = 1400;
    const PADDING = 60;
    const HEADER_HEIGHT = 110;
    const WEEKDAY_HEIGHT = 40;
    const GAP = 10;
    const COLS = 7;

    const contentWidth = CANVAS_WIDTH - PADDING * 2;
    const cellWidth = (contentWidth - GAP * (COLS - 1)) / COLS;
    const cellHeight = cellWidth * (9 / 16); // match aspect-ratio: 16/9

    // Total rows = leading empty slots + days, rounded up to full weeks
    const totalSlots = firstDayIndex + daysInMonth;
    const rows = Math.ceil(totalSlots / COLS);

    const gridHeight = rows * cellHeight + (rows - 1) * GAP;
    const CANVAS_HEIGHT = PADDING + HEADER_HEIGHT + WEEKDAY_HEIGHT + gridHeight + PADDING;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH * SCALE;
    canvas.height = CANVAS_HEIGHT * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);

    // --- Preload all images in parallel ---
    // We build a map of dateKey -> HTMLImageElement (or null on failure)
    // BEFORE drawing, so nothing gets drawn half-loaded.
    const dateKeys = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dateKeys.push(dateKey);
    }

    const loadedImages = {};
    await Promise.all(dateKeys.map(async (dateKey) => {
        const src = monthData[dateKey];
        if (!src) {
            loadedImages[dateKey] = null;
            return;
        }
        try {
            loadedImages[dateKey] = await loadImage(src);
        } catch (err) {
            console.warn(`Skipping unloadable image for ${dateKey}`, err);
            loadedImages[dateKey] = null;
        }
    }));

    // --- Draw ---

    // Background
    ctx.fillStyle = '#f5f3ee';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title
    ctx.fillStyle = '#1e1e1e';
    ctx.font = 'bold 44px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(monthLabel, PADDING, PADDING);

    // Thin rule under title
    ctx.strokeStyle = '#c9c4b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, PADDING + HEADER_HEIGHT - 20);
    ctx.lineTo(CANVAS_WIDTH - PADDING, PADDING + HEADER_HEIGHT - 20);
    ctx.stroke();

    // Weekday labels
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    ctx.fillStyle = '#8a8578';
    ctx.font = 'bold 14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.textAlign = 'center';
    const weekdayY = PADDING + HEADER_HEIGHT;
    for (let i = 0; i < COLS; i++) {
        const cellX = PADDING + i * (cellWidth + GAP) + cellWidth / 2;
        ctx.fillText(weekdays[i], cellX, weekdayY + 8);
    }
    ctx.textAlign = 'left'; // reset

    // Grid origin
    const gridY = PADDING + HEADER_HEIGHT + WEEKDAY_HEIGHT;

    // Draw cells
    for (let day = 1; day <= daysInMonth; day++) {
        const slot = firstDayIndex + day - 1;
        const row = Math.floor(slot / COLS);
        const col = slot % COLS;
        const x = PADDING + col * (cellWidth + GAP);
        const y = gridY + row * (cellHeight + GAP);

        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const img = loadedImages[dateKey];

        if (img) {
            // Clip to rounded rect, then draw the image cover-fit
            drawRoundedRect(ctx, x, y, cellWidth, cellHeight, 8);
            ctx.save();
            ctx.clip();

            // Cover-fit: scale so image fills the cell, center it
            const imgAspect = img.width / img.height;
            const cellAspect = cellWidth / cellHeight;
            let drawW, drawH, drawX, drawY;
            if (imgAspect > cellAspect) {
                // Image is wider — fit height, crop sides
                drawH = cellHeight;
                drawW = cellHeight * imgAspect;
                drawX = x - (drawW - cellWidth) / 2;
                drawY = y;
            } else {
                // Image is taller — fit width, crop top/bottom
                drawW = cellWidth;
                drawH = cellWidth / imgAspect;
                drawX = x;
                drawY = y - (drawH - cellHeight) / 2;
            }
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();

            // Faint scrim behind the day number for legibility
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.arc(x + 22, y + 22, 14, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Empty cell: outlined box
            ctx.strokeStyle = '#d8d3c7';
            ctx.lineWidth = 1.5;
            drawRoundedRect(ctx, x + 0.75, y + 0.75, cellWidth - 1.5, cellHeight - 1.5, 8);
            ctx.stroke();
        }

        // Day number on top
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(day), x + 22, y + 23);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
    }

    // --- Save ---
    const filename = `asmr_calendar_${currentYear}-${String(currentMonth + 1).padStart(2, '0')}.png`;
    canvas.toBlob(async (blob) => {
        if (!blob) {
            alert('Failed to generate PNG.');
            return;
        }
        await saveBlob(blob, filename, 'PNG Image', { 'image/png': ['.png'] });
    }, 'image/png');
}

// Small helper: trace a rounded rectangle path on the given context.
// Needed because ctx.roundRect isn't universally supported yet.
function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Start the app
init();
