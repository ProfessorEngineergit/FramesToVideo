let uploadedFiles = [];
let videoFileName = null;

const frameInput = document.getElementById('frameInput');
const fileList = document.getElementById('fileList');
const framerateInput = document.getElementById('framerateInput');
const framerateValue = document.querySelector('.framerate-value');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const statusMessage = document.getElementById('statusMessage');
const downloadSection = document.getElementById('downloadSection');
const downloadBtn = document.getElementById('downloadBtn');

// Update framerate display
framerateInput.addEventListener('input', (e) => {
    const value = Math.max(1, Math.min(60, parseInt(e.target.value) || 24));
    framerateInput.value = value;
    framerateValue.textContent = `${value} FPS`;
});

// Handle file selection
frameInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    showStatus('Uploading frames...', 'info');
    
    try {
        // Upload files to server
        const formData = new FormData();
        files.forEach(file => {
            formData.append('frames', file);
        });
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            uploadedFiles = uploadedFiles.concat(files);
            updateFileList();
            generateBtn.disabled = false;
            showStatus(`Successfully uploaded ${files.length} frame(s)!`, 'success');
        } else {
            showStatus('Error uploading files: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('Error uploading files: ' + error.message, 'error');
    }
    
    // Reset input
    frameInput.value = '';
});

// Update file list display
function updateFileList() {
    // Clear existing content efficiently
    fileList.replaceChildren();
    
    if (uploadedFiles.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.color = '#999';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.textContent = 'No frames uploaded yet';
        fileList.appendChild(emptyMsg);
        generateBtn.disabled = true;
        return;
    }
    
    // Create header paragraph
    const headerP = document.createElement('p');
    headerP.style.marginBottom = '10px';
    headerP.style.color = '#555';
    
    const strong = document.createElement('strong');
    strong.textContent = uploadedFiles.length.toString();
    headerP.appendChild(strong);
    headerP.appendChild(document.createTextNode(' frame(s) uploaded'));
    
    fileList.appendChild(headerP);
    
    // Create file items using DOM methods to prevent XSS
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.textContent = `${index + 1}. ${file.name} (${formatFileSize(file.size)})`;
        fileList.appendChild(fileItem);
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Clear all uploads
clearBtn.addEventListener('click', async () => {
    if (uploadedFiles.length === 0) {
        showStatus('No frames to clear', 'info');
        return;
    }
    
    if (!confirm('Are you sure you want to clear all uploaded frames?')) {
        return;
    }
    
    try {
        const response = await fetch('/clear', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            uploadedFiles = [];
            updateFileList();
            downloadSection.style.display = 'none';
            showStatus('All frames cleared', 'success');
        }
    } catch (error) {
        showStatus('Error clearing files: ' + error.message, 'error');
    }
});

// Generate video
generateBtn.addEventListener('click', async () => {
    if (uploadedFiles.length === 0) {
        showStatus('Please upload some frames first', 'error');
        return;
    }
    
    const framerate = parseInt(framerateInput.value);
    
    if (framerate < 1 || framerate > 60) {
        showStatus('Please enter a valid framerate (1-60 FPS)', 'error');
        return;
    }
    
    generateBtn.disabled = true;
    generateBtn.classList.add('loading');
    generateBtn.textContent = '🎬 Generating Video...';
    showStatus('Generating video... This may take a moment.', 'info');
    downloadSection.style.display = 'none';
    
    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ framerate })
        });
        
        const result = await response.json();
        
        if (result.success) {
            videoFileName = result.videoPath;
            showStatus('Video generated successfully!', 'success');
            downloadSection.style.display = 'block';
        } else {
            showStatus('Error generating video: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('Error generating video: ' + error.message, 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.classList.remove('loading');
        generateBtn.textContent = '🎥 Generate Video';
    }
});

// Download video
downloadBtn.addEventListener('click', () => {
    if (!videoFileName) {
        showStatus('No video available to download', 'error');
        return;
    }
    
    window.location.href = `/download/${videoFileName}`;
    showStatus('Download started!', 'success');
});

// Show status message
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message show ${type}`;
    
    // Auto-hide success/info messages after 5 seconds
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusMessage.classList.remove('show');
        }, 5000);
    }
}

// Initialize
updateFileList();
