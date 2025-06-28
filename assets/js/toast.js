// toast demo
document.getElementById('show-toast').addEventListener('click', function() {
  const toast = document.createElement('div');
  toast.className = 'lz-toast fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded shadow-md';
  toast.textContent = 'Hey, this is a toast!';
  document.body.appendChild(toast);
});