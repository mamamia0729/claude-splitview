// ─── DOM References ──────────────────────────────────────────────
const paneIndicators = document.getElementById('paneIndicators')
const btnAdd = document.getElementById('btnAdd')
const btnClose = document.getElementById('btnClose')
const btnReset = document.getElementById('btnReset')
const btnReload = document.getElementById('btnReload')
const dragOverlay = document.getElementById('dragOverlay')

let paneCount = 2
let activePane = 0

// ─── Pane Indicator Tabs ─────────────────────────────────────────
function renderPaneTabs () {
  paneIndicators.innerHTML = ''
  for (let i = 0; i < paneCount; i++) {
    const tab = document.createElement('div')
    tab.className = `pane-tab${i === activePane ? ' active' : ''}`
    tab.textContent = i + 1
    tab.title = `Focus pane ${i + 1} (Ctrl+${i + 1})`
    tab.addEventListener('click', () => {
      window.splitview.focusPane(i)
    })
    paneIndicators.appendChild(tab)
  }

  // Disable close button if only 1 pane
  btnClose.style.opacity = paneCount <= 1 ? '0.3' : '1'
  btnClose.style.pointerEvents = paneCount <= 1 ? 'none' : 'auto'

  // Disable add button if at max (4)
  btnAdd.style.opacity = paneCount >= 4 ? '0.3' : '1'
  btnAdd.style.pointerEvents = paneCount >= 4 ? 'none' : 'auto'
}

// ─── Button Handlers ─────────────────────────────────────────────
btnAdd.addEventListener('click', () => {
  window.splitview.addPane()
})

btnClose.addEventListener('click', () => {
  window.splitview.closeActivePane()
})

btnReset.addEventListener('click', () => {
  window.splitview.resetSplit()
})

btnReload.addEventListener('click', async () => {
  const active = await window.splitview.getActivePane()
  window.splitview.reloadPane(active)
})

// ─── Listen for Updates from Main Process ────────────────────────
window.splitview.onPaneCountChanged((count) => {
  paneCount = count
  renderPaneTabs()
})

window.splitview.onActivePaneChanged((index) => {
  activePane = index
  renderPaneTabs()
})

// ─── Resize Drag Handling ────────────────────────────────────────
// We track mouse movement on the toolbar window to update the
// divider position in the main process. The actual resizing of
// the WebContentsView panes happens in main.js.
let isDragging = false

document.addEventListener('mousedown', (e) => {
  // Only start drag if clicking near the center of the toolbar
  // (where the divider conceptually is)
  // This is a simplified approach - the real divider is between panes
})

// The drag overlay catches mouse events during resize operations
dragOverlay.addEventListener('mousemove', (e) => {
  if (!isDragging) return
  const ratio = e.clientX / window.innerWidth
  window.splitview.updateSplit(ratio)
})

dragOverlay.addEventListener('mouseup', () => {
  isDragging = false
  dragOverlay.classList.remove('active')
})

// ─── Initialize ──────────────────────────────────────────────────
renderPaneTabs()
