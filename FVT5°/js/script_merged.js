// Configuración principal
const config = {
  animationDuration: 300,
  scrollOffset: 100,
  autoHideNav: true
};

// Estado de la aplicación
const appState = {
  navOpen: false,
  currentSection: 'home',
  faqStates: new Map()
};

// Funciones de utilidad
const utils = {
  // Debounce para optimizar eventos
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Smooth scroll personalizado
  smoothScroll(target, duration = 800) {
    const targetElement = document.querySelector(target);
    if (!targetElement) return;

    const targetPosition = targetElement.offsetTop - config.scrollOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function easeInOutQuad(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
  },

  // Agregar clase con animación
  animateElement(element, className, delay = 0) {
    setTimeout(() => {
      element.classList.add(className);
    }, delay);
  },

  // Crear indicador de scroll
  createScrollIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    document.body.appendChild(indicator);
    return indicator;
  }
};

// Gestión de navegación
const navigation = {
  init() {
    this.setupToggle();
    this.setupLinks();
    this.setupScrollIndicator();
    this.handleScroll();
  },

  setupToggle() {
    const toggleBtn = document.getElementById('toggleNav');
    const nav = document.querySelector('nav');
    
    if (toggleBtn && nav) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });

      // Cerrar menú al hacer click fuera
      document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !toggleBtn.contains(e.target)) {
          this.close();
        }
      });

      // Cerrar menú con Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.close();
        }
      });
    }
  },

  setupLinks() {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        utils.smoothScroll(target);
        this.close();
        this.setActiveLink(link);
      });
    });
  },

  setupScrollIndicator() {
    this.scrollIndicator = utils.createScrollIndicator();
    this.updateScrollIndicator();
  },

  toggle() {
    const nav = document.querySelector('nav');
    appState.navOpen = !appState.navOpen;
    nav.classList.toggle('active', appState.navOpen);
    
    // Animación del botón hamburguesa
    const toggleBtn = document.getElementById('toggleNav');
    const img = toggleBtn.querySelector('img');
    if (img) {
      img.style.transform = appState.navOpen ? 'rotate(90deg)' : 'rotate(0deg)';
    }
  },

  close() {
    const nav = document.querySelector('nav');
    if (appState.navOpen) {
      appState.navOpen = false;
      nav.classList.remove('active');
      
      const toggleBtn = document.getElementById('toggleNav');
      const img = toggleBtn.querySelector('img');
      if (img) {
        img.style.transform = 'rotate(0deg)';
      }
    }
  },

  setActiveLink(activeLink) {
    document.querySelectorAll('nav a').forEach(link => {
      link.classList.remove('active');
    });
    activeLink.classList.add('active');
  },

  handleScroll() {
    const debouncedScroll = utils.debounce(() => {
      this.updateScrollIndicator();
      this.updateActiveSection();
    }, 10);

    window.addEventListener('scroll', debouncedScroll);
  },

  updateScrollIndicator() {
    if (!this.scrollIndicator) return;
    
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    this.scrollIndicator.style.width = `${scrollPercent}%`;
  },

  updateActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.pageYOffset + config.scrollOffset;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        if (appState.currentSection !== sectionId) {
          appState.currentSection = sectionId;
          const activeLink = document.querySelector(`nav a[href="#${sectionId}"]`);
          if (activeLink) {
            this.setActiveLink(activeLink);
          }
        }
      }
    });
  }
};

// Gestión de FAQ - MODIFICADO para expandir automáticamente
const faqManager = {
  init() {
    this.setupFAQItems();
    this.addKeyboardSupport();
  },

  setupFAQItems() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach((item, index) => {
      const question = item.querySelector('h3');
      const answer = item.querySelector('p');
      
      if (question && answer) {
        // Configurar identificadores únicos
        const itemId = `faq-${index}`;
        question.setAttribute('id', `${itemId}-question`);
        answer.setAttribute('id', `${itemId}-answer`);
        question.setAttribute('aria-controls', `${itemId}-answer`);
        question.setAttribute('aria-expanded', 'true'); // Siempre expandido
        question.setAttribute('tabindex', '0');
        question.setAttribute('role', 'button');

        // Estado inicial - siempre abierto
        appState.faqStates.set(itemId, true);
        
        // Expandir automáticamente todas las FAQ
        this.expandFAQ(item, itemId, question, answer);

        // Event listeners - mantener funcionalidad de toggle
        question.addEventListener('click', () => this.toggleFAQ(item, itemId));
        question.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.toggleFAQ(item, itemId);
          }
        });

        // Animación de entrada
        utils.animateElement(item, 'fade-in', index * 100);
      }
    });
  },

  expandFAQ(item, itemId, question, answer) {
    // Expandir automáticamente
    item.classList.add('active');
    question.setAttribute('aria-expanded', 'true');
    appState.faqStates.set(itemId, true);
    
    // Calcular altura del contenido
    answer.style.maxHeight = 'none'; // Remover restricción temporal
    const scrollHeight = answer.scrollHeight;
    answer.style.maxHeight = '0px'; // Restablecer para animación
    
    // Forzar repaint
    answer.offsetWidth;
    
    // Animar a altura completa
    answer.style.maxHeight = scrollHeight + 'px';
    
    // Después de la animación, permitir altura automática
    setTimeout(() => {
      if (appState.faqStates.get(itemId)) {
        answer.style.maxHeight = 'none';
      }
    }, config.animationDuration);
  },

  toggleFAQ(item, itemId) {
    const isOpen = appState.faqStates.get(itemId);
    const question = item.querySelector('h3');
    const answer = item.querySelector('p');

    if (isOpen) {
      this.closeFAQ(item, itemId, question, answer);
    } else {
      this.openFAQ(item, itemId, question, answer);
    }
  },

  openFAQ(item, itemId, question, answer) {
    item.classList.add('active');
    question.setAttribute('aria-expanded', 'true');
    appState.faqStates.set(itemId, true);

    // Animación de altura
    answer.style.maxHeight = answer.scrollHeight + 'px';
    
    // Después de la animación, permitir altura automática
    setTimeout(() => {
      if (appState.faqStates.get(itemId)) {
        answer.style.maxHeight = 'none';
      }
    }, config.animationDuration);
  },

  closeFAQ(item, itemId, question, answer) {
    item.classList.remove('active');
    question.setAttribute('aria-expanded', 'false');
    appState.faqStates.set(itemId, false);
    
    // Establecer altura fija antes de animar
    answer.style.maxHeight = answer.scrollHeight + 'px';
    
    // Forzar repaint
    answer.offsetWidth;
    
    // Animar a 0
    answer.style.maxHeight = '0px';
  },

  addKeyboardSupport() {
    // Navegación con flechas entre preguntas FAQ
    document.addEventListener('keydown', (e) => {
      const focusedElement = document.activeElement;
      const faqQuestions = Array.from(document.querySelectorAll('.faq-item h3'));
      const currentIndex = faqQuestions.indexOf(focusedElement);

      if (currentIndex === -1) return;

      let newIndex;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          newIndex = (currentIndex + 1) % faqQuestions.length;
          faqQuestions[newIndex].focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = currentIndex === 0 ? faqQuestions.length - 1 : currentIndex - 1;
          faqQuestions[newIndex].focus();
          break;
        case 'Home':
          e.preventDefault();
          faqQuestions[0].focus();
          break;
        case 'End':
          e.preventDefault();
          faqQuestions[faqQuestions.length - 1].focus();
          break;
      }
    });
  }
};

// Gestión de animaciones y efectos visuales
const animations = {
  init() {
    this.setupIntersectionObserver();
    this.addHoverEffects();
    this.setupParallax();
  },

  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    }, observerOptions);

    // Observar secciones y elementos importantes
    const elementsToObserve = document.querySelectorAll('section, .faq-item, .text-block');
    elementsToObserve.forEach(el => observer.observe(el));
  },

  addHoverEffects() {
    // Efecto de hover mejorado para imágenes
    const images = document.querySelectorAll('section img');
    images.forEach(img => {
      img.addEventListener('mouseover', () => {
        img.style.filter = 'brightness(1.1) contrast(1.1)';
      });
      
      img.addEventListener('mouseout', () => {
        img.style.filter = 'none';
      });
    });

    // Efecto de hover para el logo
    const logo = document.querySelector('.logo09');
    if (logo) {
      logo.addEventListener('mouseover', () => {
        logo.style.filter = 'drop-shadow(0 0 20px rgba(52, 152, 219, 0.5))';
      });
      
      logo.addEventListener('mouseout', () => {
        logo.style.filter = 'none';
      });
    }
  },

  setupParallax() {
    const parallaxElements = document.querySelectorAll('section img');
    
    window.addEventListener('scroll', utils.debounce(() => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;
      
      parallaxElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          element.style.transform = `translateY(${rate * 0.1}px)`;
        }
      });
    }, 10));
  }
};

// Gestión de formularios y interacciones
const interactions = {
  init() {
    this.setupButtons();
    this.setupDropdowns();
    this.addFeedback();
  },

  setupButtons() {
    const buttons = document.querySelectorAll('.button');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.createRippleEffect(e, button);
        
        // Simular acción de compra
        if (button.textContent.toLowerCase().includes('comprar')) {
          this.handlePurchase(button);
        }
      });
    });
  },

  createRippleEffect(e, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  },

  handlePurchase(button) {
    const originalText = button.textContent;
    button.textContent = 'Procesando...';
    button.disabled = true;
    
    setTimeout(() => {
      button.textContent = '¡Agregado al carrito!';
      button.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.style.background = '';
      }, 2000);
    }, 1500);
  },

  setupDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
      const button = dropdown.querySelector('.dropbtn');
      const content = dropdown.querySelector('.dropdown-content');
      
      if (button && content) {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleDropdown(content);
        });
      }
    });
  },

  toggleDropdown(content) {
    const isVisible = content.style.display === 'block';
    
    // Cerrar todos los dropdowns
    document.querySelectorAll('.dropdown-content').forEach(dc => {
      dc.style.display = 'none';
    });
    
    if (!isVisible) {
      content.style.display = 'block';
    }
  },

  addFeedback() {
    // Añadir CSS para el efecto ripple
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
};

// Gestión de rendimiento y optimización
const performance = {
  init() {
    this.lazyLoadImages();
    this.preloadCriticalResources();
    this.optimizeAnimations();
  },

  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  },

  preloadCriticalResources() {
    const criticalImages = document.querySelectorAll('img');
    criticalImages.forEach(img => {
      if (img.src) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.src;
        document.head.appendChild(link);
      }
    });
  },

  optimizeAnimations() {
    // Reducir animaciones si el usuario prefiere menos movimiento
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--transition', 'none');
    }
  }
};

// Inicialización principal
const app = {
  init() {
    // Verificar si el DOM está listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  },

  start() {
    try {
      // Inicializar módulos
      navigation.init();
      faqManager.init();
      animations.init();
      interactions.init();
      performance.init();

      // Configurar manejadores globales
      this.setupGlobalHandlers();

      // Marcar como inicializado
      document.body.classList.add('app-initialized');
      
      console.log('O.R.A. App inicializada correctamente');
    } catch (error) {
      console.error('Error al inicializar la aplicación:', error);
    }
  },

  setupGlobalHandlers() {
    // Manejar errores globales
    window.addEventListener('error', (e) => {
      console.error('Error global:', e.error);
    });

    // Manejar cambios de visibilidad de la página
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pausar animaciones cuando la página no es visible
        document.body.classList.add('page-hidden');
      } else {
        document.body.classList.remove('page-hidden');
      }
    });

    // Manejar cambios de tamaño de ventana
    window.addEventListener('resize', utils.debounce(() => {
      // Recalcular posiciones si es necesario
      navigation.updateScrollIndicator();
    }, 250));
  }
};

// Inicializar la aplicación
app.init();

/* ---- SCRIPTS ADICIONALES DE scrip2.js ---- */

// Estado global de la aplicación
 const appStateSim = {
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
  const utilsSim = {
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