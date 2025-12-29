import fs from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const musicDir = path.join(rootDir, 'music');
const imagesDir = path.join(rootDir, 'public', 'images');
const outputPath = path.join(rootDir, 'data', 'playlists.json');

async function generatePlaylists() {
  try {
    // Check if music directory exists
    if (!fs.existsSync(musicDir)) {
      console.error(`❌ Music directory not found at ${musicDir}`);
      console.log('📂 Please create a "music" folder with album subfolders containing MP3 files.');
      return;
    }

    const albums = [];
    const albumFolders = fs.readdirSync(musicDir).filter(item => {
      return fs.statSync(path.join(musicDir, item)).isDirectory();
    });

    if (albumFolders.length === 0) {
      console.warn('⚠️  No album folders found in music directory');
      fs.writeFileSync(outputPath, JSON.stringify([], null, 2));
      return;
    }

    console.log(`📂 Found ${albumFolders.length} album folder(s)\n`);

    for (const albumFolder of albumFolders) {
      const albumPath = path.join(musicDir, albumFolder);
      const mp3Files = fs.readdirSync(albumPath).filter(file => 
        file.toLowerCase().endsWith('.mp3')
      );

      if (mp3Files.length === 0) {
        console.warn(`⚠️  No MP3 files found in ${albumFolder}`);
        continue;
      }

      console.log(`🎵 Processing album: "${albumFolder}" (${mp3Files.length} songs)`);

      // Sort files naturally
      mp3Files.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/) || [0]);
        const numB = parseInt(b.match(/\d+/) || [0]);
        return numA - numB;
      });

      const songs = [];

      for (const file of mp3Files) {
        try {
          const filePath = path.join(albumPath, file);
          const metadata = await parseFile(filePath);
          const duration = Math.round(metadata.format.duration || 0);
          const title = path.parse(file).name;

          songs.push({
            id: `song-${Date.now()}-${Math.random()}`,
            title: title,
            duration: duration,
            file: `/music/${albumFolder}/${file}`
          });

          console.log(`  ✓ ${title} (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`);
        } catch (error) {
          console.error(`  ✗ Error reading ${file}: ${error.message}`);
        }
      }

      if (songs.length > 0) {
        // Check for album art (matching album folder name)
        let albumArt = '/images/placeholder.jpg';
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
        
        for (const ext of imageExtensions) {
          const imagePath = path.join(imagesDir, `${albumFolder}${ext}`);
          if (fs.existsSync(imagePath)) {
            albumArt = `/images/${albumFolder}${ext}`;
            break;
          }
        }

        albums.push({
          id: albumFolder.toLowerCase().replace(/\s+/g, '-'),
          name: albumFolder,
          artist: 'Marine Corpse', // Default artist name
          year: new Date().getFullYear(),
          albumArt: albumArt,
          songs: songs
        });

        console.log(`  🖼️  Album art: ${albumArt}\n`);
      }
    }

    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(albums, null, 2));
    console.log(`✅ Generated playlists.json with ${albums.length} album(s)`);
    console.log(`📁 Location: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error generating playlists:', error);
    process.exit(1);
  }
}

generatePlaylists();
