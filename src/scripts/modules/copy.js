export default function copy() {
  const copyButtons = document.querySelectorAll('[data-code-button]');
  const activeState = '_active';

  if(!copyButtons) {
    return;
  }

  copyButtons.forEach((btn) => {

    btn.addEventListener('click', (el) => {

      const content = el.target.closest('[data-code]').querySelector('code').innerText;

      if (!navigator.clipboard) {
        return;
      }

      navigator.clipboard.writeText(content).then(function() {
        console.log('Copying to clipboard was successful!');

        el.target.closest('[data-code-button]').classList.add(activeState);

        setTimeout(() => {
          el.target.closest('[data-code-button]').classList.remove(activeState);
        }, 1300);

      }, function(err) {
        console.error('Could not copy text: ', err);
      });

    })
  })
}
