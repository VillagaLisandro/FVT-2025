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