 // Estado global de la aplicación
 const appState = {
    is24HourFormat: true,
    chronoRunning: false,
    chronoStartTime: 0,
    chronoElapsed: 0,
    timerRunning: false,
    timerStartTime: 0,
    timerDuration: 0,
    timerRemaining: 0,
    microphoneActive: false,
    audioContext: null,
    microphone: null,
    analyzer: null
  };

  // Timer Module
  const timerModule = {
    init() {
      document.getElementById('timerStartBtn').addEventListener('click', () => this.start());
      document.getElementById('timerStopBtn').addEventListener('click', () => this.stop());
      document.getElementById('timerResetBtn').addEventListener('click', () => this.reset());
      
      // Event listeners para inputs
      document.getElementById('minutesInput').addEventListener('change', () => this.validateInputs());
      document.getElementById('secondsInput').addEventListener('change', () => this.validateInputs());
      
      setInterval(() => this.update(), 100);
    },

    validateInputs() {
      const minutesInput = document.getElementById('minutesInput');
      const secondsInput = document.getElementById('secondsInput');
      
      // Validar rangos
      if (minutesInput.value > 59) minutesInput.value = 59;
      if (minutesInput.value < 0) minutesInput.value = 0;
      if (secondsInput.value > 59) secondsInput.value = 59;
      if (secondsInput.value < 0) secondsInput.value = 0;
    },

    start() {
      if (!appState.timerRunning) {
        const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
        const seconds = parseInt(document.getElementById('secondsInput').value) || 0;
        const totalSeconds = minutes * 60 + seconds;
        
        if (totalSeconds > 0) {
          appState.timerDuration = totalSeconds;
          appState.timerRemaining = totalSeconds;
          appState.timerStartTime = Date.now();
          appState.timerRunning = true;
          
          this.showTimerView();
          this.updateButtons();
          this.playStartSound();
        }
      }
    },

    stop() {
      appState.timerRunning = false;
      this.updateButtons();
      this.updateStatus('Pausado');
    },

    reset() {
      appState.timerRunning = false;
      appState.timerRemaining = 0;
      appState.timerDuration = 0;
      
      this.showInputView();
      this.updateButtons();
      this.updateStatus('Detenido');
    },

    update() {
      if (appState.timerRunning && appState.timerDuration > 0) {
        const elapsed = Math.floor((Date.now() - appState.timerStartTime) / 1000);
        appState.timerRemaining = Math.max(0, appState.timerDuration - elapsed);
        
        this.updateDisplay();
        this.updateProgress();
        
        if (appState.timerRemaining <= 0) {
          this.onTimerComplete();
        } else if (appState.timerRemaining <= 10) {
          this.updateStatus(`¡Últimos ${appState.timerRemaining}s!`);
        } else {
          this.updateStatus('Ejecutándose...');
        }
      }
    },

    showInputView() {
      document.getElementById('timerInputs').style.display = 'flex';
      document.getElementById('timerTime').style.display = 'none';
      document.getElementById('timerProgress').style.display = 'none';
      document.getElementById('timerStatus').style.display = 'none';
    },

    showTimerView() {
      document.getElementById('timerInputs').style.display = 'none';
      document.getElementById('timerTime').style.display = 'block';
      document.getElementById('timerProgress').style.display = 'block';
      document.getElementById('timerStatus').style.display = 'flex';
    },

    updateDisplay() {
      const timerElement = document.getElementById('timerTime');
      timerElement.textContent = utils.formatTimerTime(appState.timerRemaining);
      
      // Cambiar color cuando quedan pocos segundos
      if (appState.timerRemaining <= 10 && appState.timerRemaining > 0) {
        timerElement.style.color = 'var(--accent-color)';
        timerElement.style.animation = 'pulse 1s infinite';
      } else {
        timerElement.style.color = 'var(--white)';
        timerElement.style.animation = 'none';
      }
    },

    updateProgress() {
      const circle = document.querySelector('.progress-ring-circle');
      const progressText = document.getElementById('progressText');
      
      const progress = appState.timerDuration > 0 ? appState.timerRemaining / appState.timerDuration : 0;
      const circumference = 2 * Math.PI * 54; // radio = 54
      const offset = circumference * (1 - progress);
      
      circle.style.strokeDashoffset = offset;
      progressText.textContent = `${Math.round(progress * 100)}%`;
      
      // Cambiar color del progreso
      if (progress <= 0.2) {
        circle.style.stroke = 'var(--accent-color)';
      } else if (progress <= 0.5) {
        circle.style.stroke = 'var(--warning-color)';
      } else {
        circle.style.stroke = 'var(--secondary-color)';
      }
    },

    updateStatus(status) {
      const statusText = document.getElementById('timerStatusText');
      const indicator = document.getElementById('timerIndicator');
      
      statusText.textContent = status;
      
      if (appState.timerRunning) {
        indicator.classList.remove('status-inactive');
        indicator.classList.add('status-active');
      } else {
        indicator.classList.remove('status-active');
        indicator.classList.add('status-inactive');
      }
    },

    updateButtons() {
      const startBtn = document.getElementById('timerStartBtn');
      const stopBtn = document.getElementById('timerStopBtn');
      
      if (appState.timerRunning) {
        startBtn.textContent = 'Ejecutando...';
        startBtn.disabled = true;
        stopBtn.disabled = false;
      } else {
        startBtn.textContent = 'Iniciar';
        startBtn.disabled = false;
        stopBtn.disabled = false;
      }
    },

    onTimerComplete() {
      appState.timerRunning = false;
      this.updateDisplay();
      this.updateProgress();
      this.updateButtons();
      this.updateStatus('¡Tiempo terminado!');
      this.playAlarmSound();
      this.showCompletionNotification();
    },

    playStartSound() {
      // Crear un tono de inicio suave
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.2);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    },

    playAlarmSound() {
      // Crear una alarma más notoria
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
          
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
        }, i * 400);
      }
    },

    showCompletionNotification() {
      // Efecto visual de completado
      const card = document.querySelector('.simulator-card:has(#timerTime)');
      card.style.boxShadow = '0 0 30px var(--accent-color)';
      card.style.borderColor = 'var(--accent-color)';
      
      setTimeout(() => {
        card.style.boxShadow = 'var(--shadow)';
        card.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }, 3000);
    }
  };

  // Utilidades
  const utils = {
    formatTime: (date, is24Hour = true) => {
      const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !is24Hour
      };
      return date.toLocaleTimeString('es-ES', options);
    },

    formatDate: (date) => {
      const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return date.toLocaleDateString('es-ES', options);
    },

    formatChronoTime: (milliseconds) => {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    formatTimerTime: (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    randomRange: (min, max) => {
      return Math.random() * (max - min) + min;
    }
  };

  // Clock Module
  const clockModule = {
    init() {
      this.updateClock();
      setInterval(() => this.updateClock(), 1000);
      
      document.getElementById('formatToggle').addEventListener('click', () => {
        appState.is24HourFormat = !appState.is24HourFormat;
        this.updateFormatToggle();
      });
    },

    updateClock() {
      const now = new Date();
      const timeElement = document.getElementById('currentTime');
      const dateElement = document.getElementById('currentDate');
      
      timeElement.textContent = utils.formatTime(now, appState.is24HourFormat);
      dateElement.textContent = utils.formatDate(now);
    },

    updateFormatToggle() {
      const button = document.getElementById('formatToggle');
      button.textContent = appState.is24HourFormat ? 'Cambiar a 12h' : 'Cambiar a 24h';
    }
  };

  // Chronometer Module
  const chronoModule = {
    init() {
      document.getElementById('startBtn').addEventListener('click', () => this.start());
      document.getElementById('stopBtn').addEventListener('click', () => this.stop());
      document.getElementById('resetBtn').addEventListener('click', () => this.reset());
      
      setInterval(() => this.update(), 10);
    },

    start() {
      if (!appState.chronoRunning) {
        appState.chronoRunning = true;
        appState.chronoStartTime = Date.now() - appState.chronoElapsed;
        this.updateButtons();
      }
    },

    stop() {
      appState.chronoRunning = false;
      this.updateButtons();
    },

    reset() {
      appState.chronoRunning = false;
      appState.chronoElapsed = 0;
      appState.chronoStartTime = 0;
      this.update();
      this.updateButtons();
    },

    update() {
      if (appState.chronoRunning) {
        appState.chronoElapsed = Date.now() - appState.chronoStartTime;
      }
      
      document.getElementById('chronoTime').textContent = utils.formatChronoTime(appState.chronoElapsed);
    },

    updateButtons() {
      const startBtn = document.getElementById('startBtn');
      const stopBtn = document.getElementById('stopBtn');
      
      if (appState.chronoRunning) {
        startBtn.textContent = 'Ejecutando...';
        startBtn.disabled = true;
        stopBtn.disabled = false;
      } else {
        startBtn.textContent = 'Iniciar';
        startBtn.disabled = false;
        stopBtn.disabled = false;
      }
    }
  };

  // Environment Sensor Module
  const envModule = {
    init() {
      this.updateReadings();
      setInterval(() => this.updateReadings(), 5000);
    },

    updateReadings() {
      // Simular lecturas realistas con pequeñas variaciones
      const baseTemp = 22;
      const baseHumidity = 65;
      
      const temperature = baseTemp + utils.randomRange(-2, 3);
      const humidity = baseHumidity + utils.randomRange(-5, 10);
      
      document.getElementById('temperature').textContent = Math.round(temperature);
      document.getElementById('humidity').textContent = Math.round(humidity);
    }
  };

  // Sound Meter Module
  const soundModule = {
    init() {
      this.simulateSound();
      setInterval(() => this.simulateSound(), 2000);
      
      document.getElementById('micToggle').addEventListener('click', () => this.toggleMicrophone());
    },

    simulateSound() {
      if (!appState.microphoneActive) {
        // Simulación de niveles de sonido ambiente
        const baseLevel = 45;
        const variation = utils.randomRange(-10, 25);
        const decibelLevel = Math.max(30, Math.min(100, baseLevel + variation));
        
        this.updateSoundDisplay(decibelLevel);
      }
    },

    async toggleMicrophone() {
      const button = document.getElementById('micToggle');
      const statusElement = document.getElementById('micStatus');
      const indicator = document.getElementById('micIndicator');
      
      if (!appState.microphoneActive) {
        try {
          // Solicitar acceso al micrófono
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Configurar Web Audio API
          appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          appState.microphone = appState.audioContext.createMediaStreamSource(stream);
          appState.analyzer = appState.audioContext.createAnalyser();
          
          appState.analyzer.fftSize = 256;
          appState.microphone.connect(appState.analyzer);
          
          appState.microphoneActive = true;
          button.textContent = '🎤 Desactivar Micrófono';
          button.classList.add('active');
          statusElement.textContent = 'Activo';
          indicator.classList.remove('status-inactive');
          indicator.classList.add('status-active');
          
          this.startRealTimeAnalysis();
          
        } catch (error) {
          console.error('Error al acceder al micrófono:', error);
          statusElement.textContent = 'Error - Sin acceso';
        }
      } else {
        // Desactivar micrófono
        if (appState.audioContext) {
          appState.audioContext.close();
        }
        
        appState.microphoneActive = false;
        appState.audioContext = null;
        appState.microphone = null;
        appState.analyzer = null;
        
        button.textContent = '🎤 Activar Micrófono';
        button.classList.remove('active');
        statusElement.textContent = 'Simulación';
        indicator.classList.remove('status-active');
        indicator.classList.add('status-inactive');
      }
    },

    startRealTimeAnalysis() {
      const analyze = () => {
        if (!appState.microphoneActive || !appState.analyzer) return;
        
        const bufferLength = appState.analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        appState.analyzer.getByteFrequencyData(dataArray);
        
        // Calcular el promedio de la amplitud
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        // Convertir a decibelios aproximados (escala no científica, solo visual)
        const decibelLevel = Math.max(30, Math.min(120, 30 + (average / 255) * 90));
        
        this.updateSoundDisplay(decibelLevel);
        
        requestAnimationFrame(analyze);
      };
      
      analyze();
    },

    updateSoundDisplay(decibelLevel) {
      const decibelElement = document.getElementById('decibelValue');
      const levelElement = document.getElementById('soundLevel');
      const fillElement = document.getElementById('soundFill');
      
      decibelElement.textContent = Math.round(decibelLevel);
      
      // Determinar nivel y color
      let level, color, percentage;
      
      if (decibelLevel < 50) {
        level = 'BAJO';
        color = 'var(--success-color)';
        levelElement.className = 'sound-level level-low';
        percentage = (decibelLevel - 30) / 20 * 33; // 30-50 dB = 0-33%
      } else if (decibelLevel < 70) {
        level = 'NORMAL';
        color = 'var(--warning-color)';
        levelElement.className = 'sound-level level-normal';
        percentage = 33 + ((decibelLevel - 50) / 20 * 34); // 50-70 dB = 33-67%
      } else {
        level = 'ALTO';
        color = 'var(--accent-color)';
        levelElement.className = 'sound-level level-high';
        percentage = 67 + ((decibelLevel - 70) / 50 * 33); // 70-120 dB = 67-100%
      }
      
      levelElement.textContent = level;
      fillElement.style.width = `${Math.min(100, percentage)}%`;
      fillElement.style.background = color;
    }
  };

  // Initialize Application
  document.addEventListener('DOMContentLoaded', () => {
    clockModule.init();
    chronoModule.init();
    timerModule.init();
    envModule.init();
    soundModule.init();
    
    console.log('O.R.A. Simulator inicializado correctamente');
  });