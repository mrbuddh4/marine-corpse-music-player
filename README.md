# Marine Corpse Music Player

A nostalgic, Winamp-style music player web app built with Node.js and vanilla JavaScript.

## Features

- 🎵 Classic Winamp UI design
- 📀 Album-based playlists with custom song metadata
- 🎨 Album art display
- 🎚️ Play/Pause, Skip, Previous controls
- 🔀 Shuffle mode
- 🔁 Repeat modes (no repeat, repeat all, repeat one)
- 📊 Real-time frequency visualizer
- 🔊 Volume control
- ⏱️ Song duration display and progress bar

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create your music directory structure:
```
music/
├── album1/
│   ├── song1.mp3
│   ├── song2.mp3
│   └── ...
├── album2/
│   └── ...
```

3. Create album art directory:
```
public/
└── images/
    ├── album-art-1.jpg
    ├── album-art-2.jpg
    └── ...
```

## Configuration

Edit `data/playlists.json` to add your albums and songs:

```json
[
  {
    "id": "album1",
    "name": "Album Name",
    "artist": "Your Artist Name",
    "year": 2024,
    "albumArt": "/images/album-art-1.jpg",
    "songs": [
      {
        "id": "song1",
        "title": "Song Title",
        "duration": 180,
        "file": "/music/album1/song1.mp3"
      }
    ]
  }
]
```

**Fields:**
- `duration`: Length in seconds
- `file`: Path to MP3 file relative to public directory

## Running

Start the server:
```bash
npm start
```

Open your browser to `http://localhost:3000`

## Deployment

### Deploy to Heroku (Free Alternative: Railway, Render)

1. **Install Heroku CLI** (if not already installed)

2. **Create a Heroku account** at https://heroku.com

3. **Deploy:**
```bash
heroku login
heroku create your-app-name
git push heroku main
```

Your app will be live at `https://your-app-name.herokuapp.com`

### Deploy to Railway.app (Easy)
1. Push to GitHub (see below)
2. Go to https://railway.app
3. Create new project → Import from GitHub
4. Select your repo and deploy
5. Railway will automatically detect Node.js

### Deploy to Render.com (Easy)
1. Push to GitHub
2. Go to https://render.com
3. New → Web Service → Connect GitHub repo
4. Deploy (auto-builds and runs)

## Push to GitHub

1. **Create a GitHub repository**
   - Go to https://github.com/new
   - Create repo with any name

2. **Initialize and push:**
```bash
git init
git add .
git commit -m "Initial Marine Corpse Music Player"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

3. **Share the link** - Anyone can now access your hosted player!

## How to Use

1. Select an album from the dropdown
2. Click a song to play or use the play button
3. Use controls:
   - ⏮ Previous song
   - ▶/⏸ Play/Pause
   - ⏭ Next song
   - 🔀 Toggle shuffle
   - 🔁 Toggle repeat mode

## Mobile Friendly

The player is responsive and works on mobile browsers. The classic Winamp aesthetic adapts to smaller screens while maintaining the retro feel.
