export default function setScrolledState() {
  const bodyTag = document.getElementsByTagName('body')[0];
  const scrolledStatus = '_scrolled';

  document.addEventListener('scroll', function() {
    if ((window.scrollY - 20) > 0) {
      bodyTag.classList.add(scrolledStatus);
    } else {
      bodyTag.classList.remove(scrolledStatus);
    }
  });
}
