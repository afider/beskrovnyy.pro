export default function setContentsActiveState() {

  const viewportH = document.body.clientHeight;
  const headings = document.querySelectorAll('[data-anchor]');
  const contentsLinks = document.querySelectorAll('[data-contents-item]');
  const activeStatus = '_active';

  document.addEventListener('scroll', function() {

    headings.forEach(function(h) {
    
      const hPos = h.getBoundingClientRect();
      const hPosTop = hPos.top;
      const hId = h.getAttribute('id');
  
      if (hPosTop < viewportH/2.4) {

        contentsLinks.forEach(function(el) {

          if (el.hash === '#'+ hId) {
            el.classList.add(activeStatus);
          } else {
            el.classList.remove(activeStatus);
          }
        });
      }
    });
  });
}
