const status = document.getElementById('status');
const overwrite = document.getElementById('overwrite');

chrome.storage.local.get('overwrite').then(({ overwrite: v }) => {
  overwrite.checked = v !== false;
});
overwrite.addEventListener('change', () => chrome.storage.local.set({ overwrite: overwrite.checked }));

document.getElementById('fill').addEventListener('click', async () => {
  status.textContent = 'Filling...';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.runtime.sendMessage({ action: 'fill', tabId: tab.id }, (res) => {
    if (chrome.runtime.lastError || !res) { status.textContent = 'Error: ' + (chrome.runtime.lastError?.message || 'no response'); return; }
    status.textContent = res.ok ? `Done: ${res.filled} fields filled` : 'Is page pe nahi chalega: ' + res.error;
  });
});
