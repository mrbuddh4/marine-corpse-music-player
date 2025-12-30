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

app.listen(PORT, () => {
  console.log(`🎵 Winamp Player running at http://localhost:${PORT}`);
});
