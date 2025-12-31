import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Serve music files
app.use('/music', express.static('music'));

// Serve lyrics files
app.use('/lyrics', express.static('lyrics'));

// Get albums and playlist data
app.get('/api/playlists', (req, res) => {
  try {
    const playlistsPath = path.join(__dirname, 'data', 'playlists.json');
    if (fs.existsSync(playlistsPath)) {
      const playlists = JSON.parse(fs.readFileSync(playlistsPath, 'utf8'));
      res.json(playlists);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading playlists:', error);
    res.status(500).json({ error: 'Failed to load playlists' });
  }
});

// Get total plays
app.get('/api/play-count', (req, res) => {
  try {
    const playCountPath = path.join(__dirname, 'data', 'playcount.json');
    if (fs.existsSync(playCountPath)) {
      const data = JSON.parse(fs.readFileSync(playCountPath, 'utf8'));
      res.json({ count: data.count || 0 });
    } else {
      res.json({ count: 0 });
    }
  } catch (error) {
    console.error('Error reading play count:', error);
    res.json({ count: 0 });
  }
});

// Increment play count
app.post('/api/play-count', (req, res) => {
  try {
    const playCountPath = path.join(__dirname, 'data', 'playcount.json');
    let data = { count: 0 };
    
    if (fs.existsSync(playCountPath)) {
      data = JSON.parse(fs.readFileSync(playCountPath, 'utf8'));
    }
    
    data.count = (data.count || 0) + 1;
    fs.writeFileSync(playCountPath, JSON.stringify(data, null, 2));
    res.json({ count: data.count });
  } catch (error) {
    console.error('Error updating play count:', error);
    res.status(500).json({ error: 'Failed to update play count' });
  }
});

app.listen(PORT, () => {
  console.log(`🎵 Winamp Player running at http://localhost:${PORT}`);
});
