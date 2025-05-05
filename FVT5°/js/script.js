// Animación al hacer scroll
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

boxes.forEach(box => observer.observe(box));

// Cambiar estilo del header al hacer scroll
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 100) {
    header.style.backgroundColor = '#00695c';
  } else {
    header.style.backgroundColor = '#004d40';
  }
});

// Efecto hover para botón de WhatsApp (opcional si se usa solo CSS)
const btnWsp = document.querySelector('.btn-wsp img');

if (btnWsp) {
  btnWsp.addEventListener('mouseenter', () => {
    btnWsp.style.transform = 'scale(1.1)';
  });

  btnWsp.addEventListener('mouseleave', () => {
    btnWsp.style.transform = 'scale(1)';
  });
}
