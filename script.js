let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let calendarData = {}; 
let activeClipboardImage = null; 

let targetDateKey = null;
let targetDayBox = null;
let imageInput = null; 

let contextMenu = null;
let contextMenuDateKey = null;

const YEAR_RANGE_START = new Date().getFullYear() - 10;
const YEAR_RANGE_END = new Date().getFullYear() + 10;
const YEAR_ITEM_HEIGHT = 40; 

const grid = document.getElementById('calendarGrid');
const yearBtn = document.getElementById('yearBtn');
const yearScroller = document.getElementById('yearScroller');
const monthDisplay = document.getElementById('monthDisplay');
const yearDropdown = document.getElementById('yearDropdown');
const fileInput = document.getElementById('fileInput');

function init() {
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
        imageInput.value = '';
    });
    document.body.appendChild(imageInput);

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

function handleDayClick(event, dateKey, targetBox) {
    if (event.shiftKey && activeClipboardImage) {
        applyImageToBox(dateKey, targetBox, activeClipboardImage);
        return;
    }

    targetDateKey = dateKey;
    targetDayBox = targetBox;
    imageInput.click();
}

function applyImageToBox(dateKey, targetBox, base64Image) {
    if (!calendarData[currentYear]) calendarData[currentYear] = {};
    if (!calendarData[currentYear][currentMonth]) calendarData[currentYear][currentMonth] = {};
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
        hideContextMenu();
    });

    document.getElementById('saveBtn').addEventListener('click', saveData);
    document.getElementById('loadBtn').addEventListener('click', () => fileInput.click());
    document.getElementById('exportBtn').addEventListener('click', exportMonthAsPNG);
    fileInput.addEventListener('change', loadData);

    grid.addEventListener('click', (e) => {
        const box = e.target.closest('.day-box');
        if (!box || box.classList.contains('empty') || !box.dataset.dateKey) return;
        handleDayClick(e, box.dataset.dateKey, box);
    });

    grid.addEventListener('contextmenu', (e) => {
        const box = e.target.closest('.day-box');
        if (!box || box.classList.contains('empty') || !box.dataset.dateKey) return;
        e.preventDefault();
        e.stopPropagation();
        showContextMenu(e.clientX, e.clientY, box.dataset.dateKey);
    });

    window.addEventListener('contextmenu', (e) => {
        if (contextMenu && contextMenu.classList.contains('show') && !contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    }, true);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideContextMenu();
    });
    window.addEventListener('scroll', hideContextMenu, true);
    window.addEventListener('blur', hideContextMenu);
}

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

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = src;
    });
}

async function exportMonthAsPNG() {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    const monthLabel = `${monthNames[currentMonth]} ${currentYear}`;

    const monthData = (calendarData[currentYear] && calendarData[currentYear][currentMonth]) || {};
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    const SCALE = 2;
    const CANVAS_WIDTH = 1400;
    const PADDING = 60;
    const HEADER_HEIGHT = 110;
    const WEEKDAY_HEIGHT = 40;
    const GAP = 10;
    const COLS = 7;

    const contentWidth = CANVAS_WIDTH - PADDING * 2;
    const cellWidth = (contentWidth - GAP * (COLS - 1)) / COLS;
    const cellHeight = cellWidth * (9 / 16);

    const totalSlots = firstDayIndex + daysInMonth;
    const rows = Math.ceil(totalSlots / COLS);
    const gridHeight = rows * cellHeight + (rows - 1) * GAP;
    const CANVAS_HEIGHT = PADDING + HEADER_HEIGHT + WEEKDAY_HEIGHT + gridHeight + PADDING;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH * SCALE;
    canvas.height = CANVAS_HEIGHT * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);

    const dateKeys = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dateKeys.push(dateKey);
    }

    const loadedImages = {};
    await Promise.all(dateKeys.map(async (dateKey) => {
        const src = monthData[dateKey];
        if (!src) { loadedImages[dateKey] = null; return; }
        try {
            loadedImages[dateKey] = await loadImage(src);
        } catch (err) {
            console.warn(`Skipping unloadable image for ${dateKey}`, err);
            loadedImages[dateKey] = null;
        }
    }));

    ctx.fillStyle = '#f5f3ee';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#1e1e1e';
    ctx.font = 'bold 44px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(monthLabel, PADDING, PADDING);

    ctx.strokeStyle = '#c9c4b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, PADDING + HEADER_HEIGHT - 20);
    ctx.lineTo(CANVAS_WIDTH - PADDING, PADDING + HEADER_HEIGHT - 20);
    ctx.stroke();

    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    ctx.fillStyle = '#8a8578';
    ctx.font = 'bold 14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.textAlign = 'center';
    const weekdayY = PADDING + HEADER_HEIGHT;
    for (let i = 0; i < COLS; i++) {
        const cellX = PADDING + i * (cellWidth + GAP) + cellWidth / 2;
        ctx.fillText(weekdays[i], cellX, weekdayY + 8);
    }
    ctx.textAlign = 'left';

    const gridY = PADDING + HEADER_HEIGHT + WEEKDAY_HEIGHT;

    for (let day = 1; day <= daysInMonth; day++) {
        const slot = firstDayIndex + day - 1;
        const row = Math.floor(slot / COLS);
        const col = slot % COLS;
        const x = PADDING + col * (cellWidth + GAP);
        const y = gridY + row * (cellHeight + GAP);

        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const img = loadedImages[dateKey];

        if (img) {
            drawRoundedRect(ctx, x, y, cellWidth, cellHeight, 8);
            ctx.save();
            ctx.clip();

            const imgAspect = img.width / img.height;
            const cellAspect = cellWidth / cellHeight;
            let drawW, drawH, drawX, drawY;
            if (imgAspect > cellAspect) {
                drawH = cellHeight;
                drawW = cellHeight * imgAspect;
                drawX = x - (drawW - cellWidth) / 2;
                drawY = y;
            } else {
                drawW = cellWidth;
                drawH = cellWidth / imgAspect;
                drawX = x;
                drawY = y - (drawH - cellHeight) / 2;
            }
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.arc(x + 22, y + 22, 14, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = '#d8d3c7';
            ctx.lineWidth = 1.5;
            drawRoundedRect(ctx, x + 0.75, y + 0.75, cellWidth - 1.5, cellHeight - 1.5, 8);
            ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(day), x + 22, y + 23);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
    }

    const filename = `asmr_calendar_${currentYear}-${String(currentMonth + 1).padStart(2, '0')}.png`;
    canvas.toBlob(async (blob) => {
        if (!blob) { alert('Failed to generate PNG.'); return; }
        await saveBlob(blob, filename, 'PNG Image', { 'image/png': ['.png'] });
    }, 'image/png');
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function buildContextMenu() {
    if (contextMenu) return;

    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    document.body.appendChild(contextMenu);

    contextMenu.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn || btn.disabled) return;
        e.stopPropagation();
        const action = btn.dataset.action;
        const dateKey = contextMenuDateKey;
        hideContextMenu();
        handleContextAction(action, dateKey);
    });

    contextMenu.addEventListener('contextmenu', (e) => e.preventDefault());
}

function showContextMenu(x, y, dateKey) {
    buildContextMenu();
    contextMenuDateKey = dateKey;

    const monthData = calendarData[currentYear] && calendarData[currentYear][currentMonth];
    const hasImage = !!(monthData && monthData[dateKey]);
    const canPaste = !!activeClipboardImage;

    let html = '';
    if (hasImage) {
        html += `<button data-action="replace">Replace Image</button>`;
        html += `<button data-action="copy">Copy Image</button>`;
        if (canPaste) html += `<button data-action="paste">Paste Last Image</button>`;
        html += `<hr>`;
        html += `<button data-action="save">Save Image As…</button>`;
        html += `<hr>`;
        html += `<button data-action="remove" class="danger">Remove Image</button>`;
    } else {
        html += `<button data-action="upload">Upload Image</button>`;
        if (canPaste) html += `<button data-action="paste">Paste Last Image</button>`;
    }
    contextMenu.innerHTML = html;

    contextMenu.style.left = '0px';
    contextMenu.style.top = '0px';
    contextMenu.classList.add('show');

    const rect = contextMenu.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const margin = 8;

    let finalX = x;
    let finalY = y;
    if (x + rect.width + margin > winW) finalX = winW - rect.width - margin;
    if (y + rect.height + margin > winH) finalY = winH - rect.height - margin;
    if (finalX < margin) finalX = margin;
    if (finalY < margin) finalY = margin;

    contextMenu.style.left = `${finalX}px`;
    contextMenu.style.top = `${finalY}px`;
}

function hideContextMenu() {
    if (contextMenu && contextMenu.classList.contains('show')) {
        contextMenu.classList.remove('show');
    }
    contextMenuDateKey = null;
}

function handleContextAction(action, dateKey) {
    if (!dateKey) return;

    const box = grid.querySelector(`[data-date-key="${dateKey}"]`);
    if (!box) return;

    const monthData = calendarData[currentYear] && calendarData[currentYear][currentMonth];
    const currentImage = monthData ? monthData[dateKey] : null;

    switch (action) {
        case 'upload':
        case 'replace':
            targetDateKey = dateKey;
            targetDayBox = box;
            imageInput.click();
            break;

        case 'paste':
            if (activeClipboardImage) {
                applyImageToBox(dateKey, box, activeClipboardImage);
            }
            break;

        case 'copy':
            if (currentImage) {
                activeClipboardImage = currentImage;
                box.classList.add('shake');
                setTimeout(() => box.classList.remove('shake'), 400);
            }
            break;

        case 'save':
            if (currentImage) saveImageAs(currentImage, dateKey);
            break;

        case 'remove':
            if (monthData && monthData[dateKey]) {
                delete monthData[dateKey];
                box.style.backgroundImage = '';
                const label = box.querySelector('.day-number');
                if (label) label.style.opacity = '';
                box.animate(
                    [{ opacity: 0.25 }, { opacity: 1 }],
                    { duration: 300, easing: 'ease-out' }
                );
            }
            break;
    }
}

async function saveImageAs(base64Image, dateKey) {
    try {
        const res = await fetch(base64Image);
        const blob = await res.blob();
        const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
        const filename = `asmr_${dateKey}.${ext}`;
        await saveBlob(blob, filename, 'Image', { [blob.type]: ['.' + ext] });
    } catch (err) {
        console.error('Save image failed', err);
        alert('Could not save image.');
    }
}

init();
