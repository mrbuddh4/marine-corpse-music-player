class WinampPlayer {
  constructor() {
    this.audio = document.getElementById('audioPlayer');
    this.audio.muted = true; // Start muted for autoplay policy
    this.currentPlaylist = [];
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.isShuffle = false;
    this.repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
    this.shuffledIndices = [];
    this.playCount = 0;
    this.audioContext = null;
    this.analyser = null;
    this.audioContextInitialized = false;
    
    this.initElements();
    this.setupEventListeners();
    this.loadPlaylists();
    this.fetchPlayCount();
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
    this.lyricsDisplay = document.getElementById('lyrics');
    this.playCountDisplay = document.getElementById('playCount');
    
    // Set initial volume to 80%
    this.audio.volume = 0.8;
    this.volumeSlider.value = 80;
  }

  async fetchPlayCount() {
    try {
      const response = await fetch('/api/play-count');
      const data = await response.json();
      this.playCount = data.count || 0;
      this.updatePlayCountDisplay();
    } catch (error) {
      console.error('Failed to fetch play count:', error);
    }
  }

  async incrementPlayCount() {
    try {
      const response = await fetch('/api/play-count', { method: 'POST' });
      const data = await response.json();
      this.playCount = data.count || 0;
      this.updatePlayCountDisplay();
    } catch (error) {
      console.error('Failed to increment play count:', error);
    }
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
      
      // Auto-select first album (autoplay will start after prank is dismissed)
      if (playlists.length > 0) {
        this.albumSelect.value = playlists[0].id;
        this.selectAlbum(playlists[0].id);
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
    
    // Audio event listeners
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.playBtn.textContent = '⏸';
      
      // Only count as a play if starting from the beginning (within 1 second)
      if (this.audio.currentTime < 1) {
        this.incrementPlayCount();
      }
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
    }
  }

  startAutoplay() {
    // Play immediately - audio src is already loaded from selectAlbum
    // Add small delay to ensure fetchPlayCount has completed
    setTimeout(() => {
      this.audio.muted = true; // Ensure muted for autoplay policy
      this.audio.play().then(() => {
        this.audio.muted = false; // Unmute once playing
      }).catch(err => console.log('Autoplay error:', err.message));
    }, 100);
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
    this.progressBar.value = 0; // Reset progress bar to start
    
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
    
    // Always unmute on user interaction
    this.audio.muted = false;
    
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play();
      this.incrementPlayCount();
    }
  }

  play(allowUnmute = true) {
    // Initialize audio context on first play (after user interaction)
    if (!this.audioContextInitialized) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass();
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.85;
        
        // Try to connect the analyser
        if (typeof this.audioContext.createMediaElementAudioSource === 'function') {
          const source = this.audioContext.createMediaElementAudioSource(this.audio);
          source.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
        }
        this.audioContextInitialized = true;
      } catch (e) {
        console.log('Audio context init error:', e);
      }
    }
    
    // Resume audio context if it's suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.audio.play().catch(err => {
      console.log('Play error:', err);
    });
    
    this.incrementPlayCount();
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
}

// Initialize player when DOM is loaded
let player;
document.addEventListener('DOMContentLoaded', () => {
  player = new WinampPlayer();
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
          // Start autoplay after prank is dismissed
          player.startAutoplay();
        }, 500);
      }
    }, 300);
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    // Start autoplay after prank is dismissed
    player.startAutoplay();
  });
}
