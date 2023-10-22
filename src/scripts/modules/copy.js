export default function copy() {
  const copyButtons = document.querySelectorAll('[data-code-button]');

  if(!copyButtons) {
    return;
  }

  copyButtons.forEach((btn) => {

    btn.addEventListener('click', (el) => {
      console.log('el ', el);

      const content = el.target.closest('[data-code]').querySelector('code').innerText;

      if (!navigator.clipboard) {
        return;
      }

      navigator.clipboard.writeText(content).then(function() {
        console.log('Copying to clipboard was successful!');

        el.target.closest('[data-code-button]').classList.add('_active');

        setTimeout(() => {
          el.target.closest('[data-code-button]').classList.remove('_active');
        }, 1300);

      }, function(err) {
        console.error('Could not copy text: ', err);
      });

    })
  })
}
