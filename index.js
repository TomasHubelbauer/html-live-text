window.addEventListener('load', () => {
  const demoSpan = document.querySelector('#demoSpan');
  const toggleInput = document.querySelector('#toggleInput');
  const timeDemoSpan = document.querySelector('#timeDemoSpan');

  toggleInput.addEventListener('change', () => {
    demoSpan.classList.toggle('loading', toggleInput.checked);
  });

  // Ensure browser doesn't restore last known check state and instead uses default
  toggleInput.checked = true;

  void async function () {
    while (true) {
      timeDemoSpan.classList.toggle('loading', true);

      // Simulate network
      await new Promise(resolve => window.setTimeout(resolve, 1 + Math.random() * 1000));
      timeDemoSpan.textContent = new Date().toLocaleTimeString();
      timeDemoSpan.classList.toggle('loading', false);

      // Wait to update
      await new Promise(resolve => window.setTimeout(resolve, 1 + Math.random() * 5 * 1000));
    }
  }()
});
