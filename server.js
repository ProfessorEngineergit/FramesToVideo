const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Use timestamp and index to maintain order
        const timestamp = Date.now();
        const index = req.fileIndex || 0;
        const ext = path.extname(file.originalname);
        cb(null, `frame_${timestamp}_${String(index).padStart(4, '0')}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Track file indices for ordering
let fileCounter = 0;
app.use((req, res, next) => {
    if (req.path === '/upload') {
        req.fileIndex = fileCounter++;
    }
    next();
});

// Upload endpoint
app.post('/upload', upload.array('frames'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const filePaths = req.files.map(file => file.path);
    res.json({ 
        success: true, 
        message: `${req.files.length} files uploaded successfully`,
        files: filePaths
    });
});

// Generate video endpoint
app.post('/generate', express.json(), async (req, res) => {
    const { framerate } = req.body;
    
    if (!framerate || framerate < 1 || framerate > 60) {
        return res.status(400).json({ error: 'Invalid framerate. Must be between 1 and 60.' });
    }

    const uploadsDir = path.join(__dirname, 'uploads');
    const tempDir = path.join(__dirname, 'temp');
    
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // Get all uploaded frames and sort them
    const frames = fs.readdirSync(uploadsDir)
        .filter(file => file.startsWith('frame_'))
        .sort();

    if (frames.length === 0) {
        return res.status(400).json({ error: 'No frames available to create video' });
    }

    // Create a pattern file for FFmpeg
    const outputFile = path.join(tempDir, `output_${Date.now()}.mp4`);
    const patternFile = path.join(tempDir, `pattern_${Date.now()}.txt`);
    
    // Create concat demuxer file
    const fileList = frames.map(frame => `file '${path.join(uploadsDir, frame)}'`).join('\n');
    fs.writeFileSync(patternFile, fileList);

    // Use FFmpeg to create video
    ffmpeg()
        .input(patternFile)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions([
            `-r ${framerate}`,
            '-pix_fmt yuv420p',
            '-vcodec libx264',
            '-crf 23'
        ])
        .output(outputFile)
        .on('end', () => {
            // Clean up pattern file
            fs.unlinkSync(patternFile);
            
            res.json({ 
                success: true, 
                videoPath: path.basename(outputFile),
                message: 'Video generated successfully'
            });
        })
        .on('error', (err) => {
            console.error('FFmpeg error:', err);
            if (fs.existsSync(patternFile)) {
                fs.unlinkSync(patternFile);
            }
            res.status(500).json({ error: 'Error generating video: ' + err.message });
        })
        .run();
});

// Download video endpoint
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'temp', filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Video not found' });
    }

    res.download(filePath, 'output.mp4', (err) => {
        if (err) {
            console.error('Download error:', err);
        }
        // Clean up temp file after download
        setTimeout(() => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }, 5000);
    });
});

// Clear uploads endpoint
app.post('/clear', (req, res) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    
    if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        files.forEach(file => {
            fs.unlinkSync(path.join(uploadsDir, file));
        });
    }
    
    fileCounter = 0;
    res.json({ success: true, message: 'All uploads cleared' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
