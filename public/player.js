class WinampPlayer {
  constructor() {
    this.audio = document.getElementById('audioPlayer');
    this.currentPlaylist = [];
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.isShuffle = false;
    this.repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
    this.shuffledIndices = [];
    this.playCount = parseInt(localStorage.getItem('playCount')) || 0;
    this.audioContext = null;
    this.analyser = null;
    this.audioContextInitialized = false;
    
    this.initElements();
    this.setupEventListeners();
    this.loadPlaylists();
    this.startVisualizer();
    this.updatePlayCountDisplay();
  }

  initElements() {
    this.playBtn = document.getElementById('playBtn');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.shuffleBtn = document.getElementById('shuffleBtn');
    this.repeatBtn = document.getElementById('repeatBtn');
    this.progressBar = document.getElementById('progress');
    this.volumeSlider = document.getElementById('volume');
    this.albumSelect = document.getElementById('albumSelect');
    this.songsList = document.getElementById('songsList');
    this.songTitle = document.getElementById('songTitle');
    this.songArtist = document.getElementById('songArtist');
    this.songDuration = document.getElementById('songDuration');
    this.albumArt = document.getElementById('albumArt');
    this.visualizerCanvas = document.getElementById('visualizer');
    this.lyricsDisplay = document.getElementById('lyrics');
    this.playCountDisplay = document.getElementById('playCount');
  }

  async loadPlaylists() {
    try {
      const response = await fetch('/api/playlists');
      const playlists = await response.json();
      
      // Sort albums chronologically by year (oldest to newest)
      playlists.sort((a, b) => a.year - b.year);
      
      this.albumSelect.innerHTML = '<option value="">Select an album...</option>';
      playlists.forEach(playlist => {
        const option = document.createElement('option');
        option.value = playlist.id;
        option.textContent = `${playlist.name} (${playlist.year})`;
        this.albumSelect.appendChild(option);
      });
      
      this.playlists = playlists;
      
      // Auto-select first album
      if (playlists.length > 0) {
        this.albumSelect.value = playlists[0].id;
        this.selectAlbum(playlists[0].id);
        // Remove autoplay - user must click play button
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  }

  setupEventListeners() {
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.prevBtn.addEventListener('click', () => this.previousTrack());
    this.nextBtn.addEventListener('click', () => this.nextTrack());
    this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
    this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
    this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
    this.albumSelect.addEventListener('change', (e) => this.selectAlbum(e.target.value));
    this.progressBar.addEventListener('input', (e) => this.seek(e.target.value));
    
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.onTrackEnd());
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.playBtn.textContent = '⏸';
    });
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.playBtn.textContent = '▶';
    });
  }

  selectAlbum(albumId) {
    const playlist = this.playlists.find(p => p.id === albumId);
    if (!playlist) return;

    this.currentPlaylist = playlist.songs;
    this.currentAlbum = playlist;
    this.currentTrackIndex = 0;
    this.updateSongsList();
    this.updateAlbumArt();

    if (this.currentPlaylist.length > 0) {
      this.loadTrack(0);
      this.play();
    }
  }

  updateSongsList() {
    this.songsList.innerHTML = '';
    this.currentPlaylist.forEach((song, index) => {
      const songEl = document.createElement('div');
      songEl.className = 'song-item';
      if (index === this.currentTrackIndex) songEl.classList.add('active');
      
      const duration = this.formatTime(song.duration);
      songEl.innerHTML = `
        <span class="song-name">${song.title}</span>
        <span class="song-length">${duration}</span>
      `;
      
      songEl.addEventListener('click', () => {
        this.currentTrackIndex = index;
        this.loadTrack(index);
        this.play();
        this.updateSongsList();
      });
      
      this.songsList.appendChild(songEl);
    });
  }

  updateAlbumArt() {
    if (this.currentAlbum && this.currentAlbum.albumArt) {
      this.albumArt.src = this.currentAlbum.albumArt;
    }
  }

  loadTrack(index) {
    if (this.currentPlaylist.length === 0) return;
    
    const track = this.currentPlaylist[index];
    this.audio.src = track.file;
    this.songTitle.textContent = track.title;
    this.songArtist.textContent = this.currentAlbum?.artist || 'Unknown Artist';
    this.progressBar.max = track.duration;
    
    // Fetch lyrics from text file
    this.loadLyrics(track);
  }

  async loadLyrics(track) {
    try {
      // Construct the lyrics file path using album name and full song title
      const lyricsPath = `/lyrics/${this.currentAlbum.name}/${track.title}.txt`;
      const response = await fetch(lyricsPath);
      
      if (response.ok) {
        const lyrics = await response.text();
        this.lyricsDisplay.textContent = lyrics;
      } else {
        this.lyricsDisplay.textContent = 'No lyrics available';
      }
    } catch (error) {
      this.lyricsDisplay.textContent = 'No lyrics available';
    }
  }

  togglePlay() {
    if (this.audio.src === '') {
      if (this.currentPlaylist.length > 0) {
        this.loadTrack(0);
      } else {
        alert('Please select an album first');
        return;
      }
    }
    
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play();
    }
  }

  play() {
    this.audio.muted = false;
    this.audio.play().catch(err => {
      console.error('Play error:', err);
    });
    this.playCount++;
    localStorage.setItem('playCount', this.playCount);
    this.updatePlayCountDisplay();
  }

  updatePlayCountDisplay() {
    this.playCountDisplay.textContent = this.playCount;
  }

  pause() {
    this.audio.pause();
  }

  nextTrack() {
    if (this.currentPlaylist.length === 0) return;
    
    if (this.isShuffle) {
      this.currentTrackIndex = Math.floor(Math.random() * this.currentPlaylist.length);
    } else {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.currentPlaylist.length;
    }
    
    this.loadTrack(this.currentTrackIndex);
    this.play();
    this.updateSongsList();
  }

  previousTrack() {
    if (this.currentPlaylist.length === 0) return;
    
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.currentPlaylist.length) % this.currentPlaylist.length;
    this.loadTrack(this.currentTrackIndex);
    this.play();
    this.updateSongsList();
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.shuffleBtn.classList.toggle('active', this.isShuffle);
  }

  toggleRepeat() {
    this.repeatMode = (this.repeatMode + 1) % 3;
    if (this.repeatMode === 0) {
      this.repeatBtn.classList.remove('active');
    } else {
      this.repeatBtn.classList.add('active');
    }
  }

  onTrackEnd() {
    if (this.repeatMode === 2) {
      // Repeat one
      this.audio.currentTime = 0;
      this.audio.play();
    } else if (this.repeatMode === 1 && this.currentTrackIndex === this.currentPlaylist.length - 1) {
      // Repeat all - go back to start
      this.currentTrackIndex = 0;
      this.loadTrack(0);
      this.play();
      this.updateSongsList();
    } else {
      // Normal - play next
      this.nextTrack();
    }
  }

  setVolume(value) {
    this.audio.volume = value / 100;
  }

  seek(value) {
    this.audio.currentTime = value;
  }

  updateProgress() {
    const current = this.audio.currentTime || 0;
    const duration = this.audio.duration || 0;
    
    this.progressBar.value = current;
    this.songDuration.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  startVisualizer() {
    const canvas = this.visualizerCanvas;
    const ctx = canvas.getContext('2d');
    
    // Set canvas resolution
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    let animationPhase = 0;

    const draw = () => {
      requestAnimationFrame(draw);
      animationPhase += 0.05;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barCount = 10;
      const barWidth = canvas.width / barCount;
      
      // Check if audio is actually playing
      const isAudioPlaying = this.audio && !this.audio.paused && this.audio.currentTime > 0;
      
      for (let i = 0; i < barCount; i++) {
        let barHeight;
        
        if (isAudioPlaying) {
          // When playing, show animated bars with slight variations
          const pulsePhase = animationPhase + (i / barCount) * Math.PI * 2;
          const basePulse = Math.sin(pulsePhase) * 0.5 + 0.5;
          const variance = Math.sin(pulsePhase * 1.5 + i * 0.3) * 0.25;
          barHeight = (basePulse + variance) * canvas.height * 0.85;
          barHeight = Math.max(barHeight, 8); // Minimum height when playing
        } else {
          // Idle wave when not playing
          const wave = Math.sin(animationPhase + i * 0.5) * 0.5 + 0.5;
          barHeight = wave * canvas.height * 0.5;
        }
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(i * barWidth + 2, canvas.height - barHeight, barWidth - 4, barHeight);
      }
    };

    draw();
  }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WinampPlayer();
  initPrankModal();
});

// Prank Modal
function initPrankModal() {
  const modal = document.getElementById('prankModal');
  const okBtn = document.getElementById('prankOkBtn');
  const closeBtn = document.getElementById('prankCloseBtn');
  const prankProgress = document.getElementById('prankProgress');
  const prankProgressFill = document.getElementById('prankProgressFill');

  okBtn.addEventListener('click', () => {
    okBtn.disabled = true;
    prankProgress.style.display = 'block';
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10 + 5;
      if (progress > 100) progress = 100;
      
      prankProgressFill.style.width = progress + '%';
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          modal.style.display = 'none';
        }, 500);
      }
    }, 300);
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}
