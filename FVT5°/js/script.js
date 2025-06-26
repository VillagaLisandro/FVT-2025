// Animación al hacer scroll (fade in)
const boxes = document.querySelectorAll('.box');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.1
});

boxes.forEach(box => {
  observer.observe(box);
});

// Cambiar fondo del header al hacer scroll
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

  document.querySelectorAll('.footer-icons a').forEach(icon => {
    icon.addEventListener('mouseenter', () => {
      icon.style.transform = 'scale(1.2)';
    });

    icon.addEventListener('mouseleave', () => {
      icon.style.transform = 'scale(1)';
    });
  });

document.querySelectorAll('.faq-item h3').forEach(pregunta => {
  pregunta.style.cursor = 'pointer';
  const respuesta = pregunta.nextElementSibling;
  if (respuesta) {
    respuesta.style.maxHeight = "0";
    respuesta.style.overflow = "hidden";
    respuesta.style.transition = "all 0.3s ease";
    respuesta.style.opacity = 0;
  }

  pregunta.addEventListener('click', () => {
    const respuesta = pregunta.nextElementSibling;
    if (respuesta.classList.contains('visible')) {
      respuesta.classList.remove('visible');
      respuesta.style.maxHeight = "0";
      respuesta.style.opacity = 0;
    } else {
      respuesta.classList.add('visible');
      respuesta.style.maxHeight = respuesta.scrollHeight + "px";
      respuesta.style.opacity = 1;
    }
  });
});