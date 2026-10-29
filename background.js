async function runFill(tabId) {
  const { overwrite = true } = await chrome.storage.local.get('overwrite');
  const target = { tabId, allFrames: true };
  await chrome.scripting.executeScript({ target, files: ['content.js'] });
  const results = await chrome.scripting.executeScript({
    target,
    func: (opts) => (window.__autoFillRun ? window.__autoFillRun(opts) : null),
    args: [{ overwrite }]
  });
  let filled = 0, total = 0;
  for (const r of results) {
    if (r && r.result) { filled += r.result.filled; total += r.result.total; }
  }
  return { filled, total };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.action === 'fill') {
    runFill(msg.tabId)
      .then((r) => sendResponse({ ok: true, ...r }))
      .catch((e) => sendResponse({ ok: false, error: String(e && e.message || e) }));
    return true; // async response
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'fill-form') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) { try { await runFill(tab.id); } catch (e) { console.warn(e); } }
});
