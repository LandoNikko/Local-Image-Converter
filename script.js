// Header buttons
const themeToggle = document.getElementById('theme-toggle');
const infoBtn = document.getElementById('info-btn');
const infoTooltip = document.getElementById('info-tooltip');
const body = document.body;
const THEME_KEY = 'imageConverterTheme';

// Theme toggle functionality
function applyTheme(theme) {
    const themeIcon = themeToggle.querySelector('i');
    if (theme === 'dark') {
        body.classList.add('dark-theme');
        themeIcon.className = 'ri-sun-line';
    } else {
        body.classList.remove('dark-theme');
        themeIcon.className = 'ri-moon-line';
    }
}

themeToggle.addEventListener('click', () => {
    const newTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
});

// Info button functionality
function toggleInfoTooltip() {
    const isVisible = infoTooltip.classList.toggle('show');
    const icon = infoBtn.querySelector('i');
    icon.className = isVisible ? 'ri-close-line' : 'ri-information-line';

    const appContainer = document.querySelector('.app-container');
    if (isVisible) {
        appContainer.classList.add('blur-behind');
    } else {
        appContainer.classList.remove('blur-behind');
    }
}

function closeInfoTooltip() {
    infoTooltip.classList.remove('show');
    const icon = infoBtn.querySelector('i');
    icon.className = 'ri-information-line';

    const appContainer = document.querySelector('.app-container');
    appContainer.classList.remove('blur-behind');
}

infoBtn.addEventListener('click', toggleInfoTooltip);

document.addEventListener('click', (e) => {
    if (!infoBtn.contains(e.target) && !infoTooltip.contains(e.target)) {
        closeInfoTooltip();
    }
});

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const formatRadios = document.querySelectorAll('input[name="format"]');
const bwFilterRadios = document.querySelectorAll('input[name="bw-filter"]');
const convertBtn = document.getElementById('convert-btn');
const btnText = document.getElementById('btn-text');
const statusMsg = document.getElementById('status');
const previewContainer = document.getElementById('preview-container');
const previewCanvas = document.getElementById('preview-canvas');
const selectAllCheckbox = document.getElementById('select-all-checkbox');
const qualityControl = document.getElementById('quality-control');
const jpgQualitySlider = document.getElementById('jpg-quality-slider');
const jpgQualityValue = document.getElementById('jpg-quality-value');
const webpQualitySlider = document.getElementById('webp-quality-slider');
const webpQualityValue = document.getElementById('webp-quality-value');
const uploadMoreBtn = document.getElementById('upload-more-btn');

let selectedFiles = [];
let activePreviewIndex = -1;

// Initialize page state
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(savedTheme);
    showPlaceholder();
    updateSliderFill(jpgQualitySlider);
    updateSliderFill(webpQualitySlider);
    updateConvertedFileNames();
    const currentFormat = document.querySelector('input[name="format"]:checked').value;
    if (currentFormat === 'jpg') {
        updateQualityValue('jpg');
    } else if (currentFormat === 'webp') {
        updateQualityValue('webp');
    }
});

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });
convertBtn.addEventListener('click', startConversionProcess);
formatRadios.forEach(radio => radio.addEventListener('change', updateConvertedFileNames));
selectAllCheckbox.addEventListener('change', toggleSelectAll);
jpgQualitySlider.addEventListener('input', () => updateQualityValue('jpg'));
webpQualitySlider.addEventListener('input', () => updateQualityValue('webp'));
let isUploadMore = false;

uploadMoreBtn.addEventListener('click', () => {
    isUploadMore = true;
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files, isUploadMore);
    isUploadMore = false;
});

bwFilterRadios.forEach(radio => {
    radio.addEventListener('change', updateBwFilterText);
});

function handleFiles(files, append = false) {
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (newFiles.length === 0) {
        if (!append) {
            resetToInitialState();
        }
        return;
    }

    if (append) {
        selectedFiles = [...selectedFiles, ...newFiles];
    } else {
        selectedFiles = newFiles;
    }

    populateFileList();
    updateConvertedFileNames();
    if (!append) {
        updateActivePreview(0); // Select the first file by default
    }
    updateButtonState();
    updateDropZoneAnimation();

    statusMsg.textContent = "";
    statusMsg.className = "";
}

function populateFileList() {
    fileList.innerHTML = '';
    const fragment = document.createDocumentFragment();

    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.index = index;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.addEventListener('change', updateButtonState);
        checkbox.addEventListener('click', e => e.stopPropagation()); // Prevent item click when toggling checkbox

        const originalNameSpan = document.createElement('span');
        originalNameSpan.textContent = file.name;
        originalNameSpan.title = file.name;

        const convertedNameSpan = document.createElement('span');
        convertedNameSpan.className = 'converted-name';

        fileItem.appendChild(checkbox);
        fileItem.appendChild(originalNameSpan);
        fileItem.appendChild(convertedNameSpan);

        fileItem.addEventListener('click', () => updateActivePreview(index));
        fragment.appendChild(fileItem);
    });

    fileList.appendChild(fragment);
    selectAllCheckbox.checked = true;
}

function updateActivePreview(index) {
    if (index === activePreviewIndex || !selectedFiles[index]) return;
    activePreviewIndex = index;

    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`.file-item[data-index='${index}']`).classList.add('active');

    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            const ctx = previewCanvas.getContext('2d');
            previewCanvas.width = img.naturalWidth;
            previewCanvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            previewContainer.style.display = 'block';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(selectedFiles[index]);
}

function updateButtonState() {
    const checkedBoxes = document.querySelectorAll('.file-item input[type="checkbox"]:checked');
    const checkedCount = checkedBoxes.length;
    convertBtn.disabled = checkedCount === 0;
    selectAllCheckbox.checked = checkedCount === selectedFiles.length;

    if (checkedCount > 0) {
        btnText.textContent = `Convert & Download ${checkedCount} Image${checkedCount > 1 ? 's' : ''}`;
    } else {
        btnText.textContent = "Select Files to Convert";
    }
}

function toggleSelectAll() {
    const isChecked = selectAllCheckbox.checked;
    const checkboxes = document.querySelectorAll('.file-item input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = isChecked);
    updateButtonState();
}

function showPlaceholder() {
    fileList.innerHTML = `<div class="file-list-placeholder"><i class="ri-file-list-3-line"></i><p>Your uploaded files will appear here.</p></div>`;
    selectAllCheckbox.checked = false;
}

function resetToInitialState() {
    showPlaceholder();
    convertBtn.disabled = true;
    btnText.textContent = "Select Files";
    previewContainer.style.display = 'none';
    activePreviewIndex = -1;
    updateDropZoneAnimation();
}

function updateConvertedFileNames() {
    const format = document.querySelector('input[name="format"]:checked').value;

    // Show/hide quality control based on format
    if (format === 'jpg' || format === 'webp') {
        qualityControl.style.display = 'block';
        document.getElementById('jpg-quality').style.display = format === 'jpg' ? 'block' : 'none';
        document.getElementById('webp-quality').style.display = format === 'webp' ? 'block' : 'none';

        // Update slider fill for the visible slider
        if (format === 'jpg') {
            updateSliderFill(jpgQualitySlider);
        } else if (format === 'webp') {
            updateSliderFill(webpQualitySlider);
        }
    } else {
        qualityControl.style.display = 'none';
    }

    // Update file names only if files are selected
    if (selectedFiles.length === 0) return;
    const fileItems = fileList.querySelectorAll('.file-item');
    fileItems.forEach((item, index) => {
        const originalName = selectedFiles[index].name;
        const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
        const newFileName = `${baseName}.${format}`;
        item.querySelector('.converted-name').textContent = newFileName;
    });
}

function updateQualityValue(format) {
    if (format === 'jpg') {
        jpgQualityValue.textContent = jpgQualitySlider.value + '%';
        updateSliderFill(jpgQualitySlider);
    } else if (format === 'webp') {
        webpQualityValue.textContent = webpQualitySlider.value + '%';
        updateSliderFill(webpQualitySlider);
    }
}

function updateBwFilterText() {
    const selectedValue = document.querySelector('input[name="bw-filter"]:checked').value;
    const btnTexts = document.querySelectorAll('.bw-btn-text');

    if (selectedValue === 'enable') {
        btnTexts[0].textContent = 'Disable';
        btnTexts[1].textContent = 'Enabled';
    } else {
        btnTexts[0].textContent = 'Disabled';
        btnTexts[1].textContent = 'Enable';
    }
}

function updateDropZoneAnimation() {
    if (selectedFiles.length === 0) {
        dropZone.classList.remove('has-files');
    } else {
        dropZone.classList.add('has-files');
    }
}

function updateSliderFill(slider) {
    const value = slider.value;
    const percentage = value + '%';
    const glowIntensity = value / 100;
    const glowBlur = Math.max(2, glowIntensity * 15);
    const glowOpacity = Math.max(0.1, glowIntensity * 0.8);

    const glowColor = `rgba(74, 119, 226, ${glowOpacity})`;
    slider.style.background = `linear-gradient(to right,
        var(--accent-color) 0%,
        var(--accent-color) ${percentage},
        transparent ${percentage},
        transparent 100%)`;

    if (value > 0) {
        const glowGradient = `linear-gradient(to right,
            ${glowColor} 0%,
            ${glowColor} ${percentage},
            transparent ${percentage},
            transparent 100%)`;
        slider.style.background = `${glowGradient}, ${slider.style.background}`;

        const outerGlowOpacity = glowOpacity * 0.3;
        slider.style.boxShadow = `inset 2px 2px 4px var(--shadow-dark),
                                 inset -2px -2px 4px var(--shadow-light),
                                 0 0 ${glowBlur}px rgba(74, 119, 226, ${outerGlowOpacity})`;
    } else {
        slider.style.boxShadow = `inset 2px 2px 4px var(--shadow-dark),
                                 inset -2px -2px 4px var(--shadow-light)`;
    }
}

async function startConversionProcess() {
    const format = document.querySelector('input[name="format"]:checked').value;
    const applyBwFilter = document.querySelector('input[name="bw-filter"]:checked').value === 'enable';

    const filesToConvert = selectedFiles.filter((file, index) => {
        return document.querySelector(`.file-item[data-index='${index}'] input[type="checkbox"]`).checked;
    });

    if (filesToConvert.length === 0) {
        setStatusMessage('error', 'No files selected for conversion.');
        return;
    }

    setLoadingState(true, 'Initializing...');
    const conversionPromises = filesToConvert.map(file => convertImage(file, format, applyBwFilter));

    try {
        const convertedImages = await Promise.all(conversionPromises);
        if (convertedImages.length === 1) {
            downloadFile(convertedImages[0].blob, convertedImages[0].filename);
        } else {
            setStatusMessage('success', 'Creating ZIP file...');
            const zip = new JSZip();
            convertedImages.forEach(img => zip.file(img.filename, img.blob));
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            downloadFile(zipBlob, 'converted-images.zip');
        }
        setStatusMessage('success', 'Conversion successful!');
    } catch (error) {
        setStatusMessage('error', `An error occurred: ${error.message}`);
    } finally {
        setLoadingState(false);
    }
}

function convertImage(file, format, applyBwFilter) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (applyBwFilter) ctx.filter = 'grayscale(100%)';
                ctx.drawImage(img, 0, 0);

                let mimeType;
                switch (format) {
                    case 'png': mimeType = 'image/png'; break;
                    case 'jpg': mimeType = 'image/jpeg'; break;
                    case 'webp': mimeType = 'image/webp'; break;
                }

                let quality;
                if (format === 'jpg') {
                    quality = parseInt(jpgQualitySlider.value) / 100;
                } else if (format === 'webp') {
                    quality = parseInt(webpQualitySlider.value) / 100;
                } else {
                    quality = undefined;
                }
                const dotIndex = file.name.lastIndexOf('.');
                const baseName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
                const newFileName = `${baseName}.${format}`;

                let timeoutId;
                const onBlob = (blob) => {
                    clearTimeout(timeoutId);
                    if (blob) resolve({ filename: newFileName, blob });
                    else reject(new Error(`Failed to create blob for ${file.name}`));
                };
                timeoutId = setTimeout(() => {
                    reject(new Error(`Timed out creating blob for ${file.name}`));
                }, 10000); // 10 seconds
                try {
                    canvas.toBlob(onBlob, mimeType, quality);
                } catch (err) {
                    clearTimeout(timeoutId);
                    reject(new Error(`Exception in toBlob for ${file.name}: ${err.message}`));
                }
            };
            img.onerror = () => reject(new Error(`Could not load image: ${file.name}`));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error(`Could not read file: ${file.name}`));
        reader.readAsDataURL(file);
    });
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function setLoadingState(isLoading, message = 'Processing...') {
    convertBtn.disabled = isLoading;
    if (isLoading) {
        btnText.textContent = message;
        statusMsg.textContent = 'Please wait...';
        statusMsg.className = "";
    } else {
        updateButtonState();
    }
}

function setStatusMessage(type, message) {
    statusMsg.className = type;
    statusMsg.textContent = message;
}
