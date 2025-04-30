document.addEventListener('DOMContentLoaded', () => {
    const backArrow = document.querySelector('.back-arrow');
    const menuButtons = document.querySelectorAll('.menu-item button');
  
    backArrow.addEventListener('click', () => {
      const homeUrl = backArrow.getAttribute('data-home-url');
      window.location.href = homeUrl;
    });
  
    menuButtons.forEach(button => {
      button.addEventListener('click', () => {
        const href = button.getAttribute('data-href');
        if (href) {
          window.location.href = href;
        }
      });
    });
  });