const {
  app,
  BaseWindow,
  WebContentsView,
  ipcMain,
  globalShortcut
} = require('electron')
const path = require('path')

// ─── State ───────────────────────────────────────────────────────────
let mainWindow = null
const panes = []            // Array of { id, view, partition }
let activePaneIndex = 0     // Which pane has focus
let dividerRatio = 0.5      // 0.0–1.0, where the split sits
const TOOLBAR_HEIGHT = 44
const CLAUDE_URL = 'https://claude.ai'
const MIN_PANE_RATIO = 0.2
const MAX_PANE_RATIO = 0.8

// No custom user-agent — just let Electron be Electron, like the official Claude Desktop app

// ─── Window Creation ─────────────────────────────────────────────────
function createMainWindow () {
  mainWindow = new BaseWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 500,
    title: 'Claude SplitView',
    backgroundColor: '#1a1a2e',
    show: false
  })

  // Toolbar view (the thin bar at the top with controls)
  const toolbarView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWindow.contentView.addChildView(toolbarView)
  toolbarView.webContents.loadFile(path.join(__dirname, 'renderer', 'index.html'))

  // Store toolbar reference for layout calculations
  mainWindow.toolbarView = toolbarView

  // Create the initial two panes
  createPane('pane-1')
  createPane('pane-2')

  // Initial layout
  updateLayout()

  // Recalculate layout on window resize
  mainWindow.on('resize', () => updateLayout())

  // Show window once toolbar has loaded
  toolbarView.webContents.on('did-finish-load', () => {
    mainWindow.show()
    focusPane(0)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ─── Pane Management ─────────────────────────────────────────────────
function createPane (partitionName) {
  // No custom partition — use default session just like the official Claude Desktop app.
  // All panes share one session, so you log in once and all panes are authenticated.
  const view = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      sandbox: false
    }
  })

  mainWindow.contentView.addChildView(view)
  view.webContents.loadURL(CLAUDE_URL)

  // Handle popups: let auth popups open naturally (preserves window.opener
  // so claude.ai's OAuth callback can communicate back to the pane).
  // Non-auth links open in the system browser.
  view.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const hostname = new URL(url).hostname
      const isAuth = ['accounts.google.com', 'appleid.apple.com', 'claude.ai',
                       'auth.claude.ai', 'anthropic.com'].some(d => hostname.includes(d))

      if (isAuth) {
        // Let Electron open it as a real popup — this preserves window.opener
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: 500,
            height: 700,
            title: 'Sign in to Claude',
            autoHideMenuBar: true
          }
        }
      }
    } catch {}

    require('electron').shell.openExternal(url)
    return { action: 'deny' }
  })

  const pane = {
    id: partitionName,
    view
  }
  panes.push(pane)

  // Notify toolbar of pane count change
  sendToToolbar('pane-count-changed', panes.length)

  return pane
}

// No custom auth window needed — Electron handles OAuth popups natively
// with { action: 'allow' }, preserving window.opener for the callback

// ─── Pane Removal / Focus ────────────────────────────────────────────
function removePane (index) {
  if (panes.length <= 1) return

  const pane = panes[index]
  mainWindow.contentView.removeChildView(pane.view)
  pane.view.webContents.close()
  panes.splice(index, 1)

  if (activePaneIndex >= panes.length) {
    activePaneIndex = panes.length - 1
  }

  dividerRatio = 1 / panes.length
  updateLayout()
  focusPane(activePaneIndex)
  sendToToolbar('pane-count-changed', panes.length)
}

function focusPane (index) {
  if (index < 0 || index >= panes.length) return
  activePaneIndex = index
  panes[index].view.webContents.focus()
  sendToToolbar('active-pane-changed', index)
}

// ─── Layout Engine ───────────────────────────────────────────────────
function updateLayout () {
  if (!mainWindow) return

  const bounds = mainWindow.getContentBounds()
  const width = bounds.width
  const height = bounds.height

  if (mainWindow.toolbarView) {
    mainWindow.toolbarView.setBounds({
      x: 0,
      y: 0,
      width: width,
      height: TOOLBAR_HEIGHT
    })
  }

  const availableHeight = height - TOOLBAR_HEIGHT
  const paneCount = panes.length

  if (paneCount === 1) {
    panes[0].view.setBounds({
      x: 0,
      y: TOOLBAR_HEIGHT,
      width: width,
      height: availableHeight
    })
  } else if (paneCount === 2) {
    const leftWidth = Math.floor(width * dividerRatio)
    const rightWidth = width - leftWidth

    panes[0].view.setBounds({
      x: 0,
      y: TOOLBAR_HEIGHT,
      width: leftWidth - 2,
      height: availableHeight
    })
    panes[1].view.setBounds({
      x: leftWidth + 2,
      y: TOOLBAR_HEIGHT,
      width: rightWidth - 2,
      height: availableHeight
    })
  } else {
    const paneWidth = Math.floor(width / paneCount)
    panes.forEach((pane, i) => {
      pane.view.setBounds({
        x: i * paneWidth + (i > 0 ? 2 : 0),
        y: TOOLBAR_HEIGHT,
        width: paneWidth - 4,
        height: availableHeight
      })
    })
  }
}

// ─── IPC Handlers ────────────────────────────────────────────────────
function sendToToolbar (channel, data) {
  if (mainWindow && mainWindow.toolbarView) {
    mainWindow.toolbarView.webContents.send(channel, data)
  }
}

ipcMain.on('add-pane', () => {
  if (panes.length >= 4) return
  const newId = `pane-${Date.now()}`
  createPane(newId)
  dividerRatio = 1 / panes.length
  updateLayout()
  focusPane(panes.length - 1)
})

ipcMain.on('remove-pane', (_event, index) => {
  removePane(index)
})

ipcMain.on('close-active-pane', () => {
  removePane(activePaneIndex)
})

ipcMain.on('focus-pane', (_event, index) => {
  focusPane(index)
})

ipcMain.on('update-split', (_event, ratio) => {
  dividerRatio = Math.max(MIN_PANE_RATIO, Math.min(MAX_PANE_RATIO, ratio))
  updateLayout()
})

ipcMain.on('reset-split', () => {
  dividerRatio = 0.5
  updateLayout()
})

ipcMain.on('reload-pane', (_event, index) => {
  if (panes[index]) {
    panes[index].view.webContents.loadURL(CLAUDE_URL)
  }
})

ipcMain.handle('get-pane-count', () => panes.length)
ipcMain.handle('get-active-pane', () => activePaneIndex)

// ─── App Lifecycle ───────────────────────────────────────────────────
app.whenReady().then(() => {
  createMainWindow()

  // Keyboard shortcuts
  for (let i = 1; i <= 4; i++) {
    globalShortcut.register(`CommandOrControl+${i}`, () => focusPane(i - 1))
  }

  globalShortcut.register('CommandOrControl+N', () => {
    if (panes.length < 4) {
      const newId = `pane-${Date.now()}`
      createPane(newId)
      dividerRatio = 1 / panes.length
      updateLayout()
      focusPane(panes.length - 1)
    }
  })

  globalShortcut.register('CommandOrControl+W', () => {
    removePane(activePaneIndex)
  })

  globalShortcut.register('CommandOrControl+\\', () => {
    dividerRatio = 0.5
    updateLayout()
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
