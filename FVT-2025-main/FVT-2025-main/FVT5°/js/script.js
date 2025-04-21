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
