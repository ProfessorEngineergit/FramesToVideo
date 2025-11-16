# FramesToVideo

A simple web application that allows you to upload individual image frames, select a video framerate, and download the final compiled video.

## Features

- 📁 Upload multiple image frames (JPG, PNG, GIF, BMP)
- 🎬 Select custom framerate (1-60 FPS)
- 🎥 Generate video from uploaded frames using FFmpeg
- ⬇️ Download the generated video
- 🗑️ Clear uploaded frames to start over

## Prerequisites

- Node.js (v14 or higher)
- FFmpeg installed on your system

### Installing FFmpeg

**On Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**On macOS:**
```bash
brew install ffmpeg
```

**On Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ProfessorEngineergit/FramesToVideo.git
cd FramesToVideo
```

2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Follow the on-screen instructions:
   - Upload your image frames
   - Set the desired framerate (FPS)
   - Click "Generate Video"
   - Download your video!

## How It Works

1. **Upload**: The app accepts image files and stores them on the server
2. **Process**: FFmpeg combines the images into a video at the specified framerate
3. **Download**: The generated video is made available for download

## Technology Stack

- **Backend**: Node.js, Express
- **File Upload**: Multer
- **Video Processing**: FFmpeg (via fluent-ffmpeg)
- **Frontend**: HTML, CSS, JavaScript

## License

This project is licensed under the ISC License - see the LICENSE file for details.