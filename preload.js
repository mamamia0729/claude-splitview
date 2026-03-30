const { contextBridge, ipcRenderer } = require('electron')

// Expose safe IPC methods to the toolbar renderer
contextBridge.exposeInMainWorld('splitview', {
  // Pane management
  addPane: () => ipcRenderer.send('add-pane'),
  closeActivePane: () => ipcRenderer.send('close-active-pane'),
  focusPane: (index) => ipcRenderer.send('focus-pane', index),
  reloadPane: (index) => ipcRenderer.send('reload-pane', index),

  // Layout
  updateSplit: (ratio) => ipcRenderer.send('update-split', ratio),
  resetSplit: () => ipcRenderer.send('reset-split'),

  // Queries
  getPaneCount: () => ipcRenderer.invoke('get-pane-count'),
  getActivePane: () => ipcRenderer.invoke('get-active-pane'),

  // Event listeners from main process
  onPaneCountChanged: (callback) => {
    ipcRenderer.on('pane-count-changed', (_event, count) => callback(count))
  },
  onActivePaneChanged: (callback) => {
    ipcRenderer.on('active-pane-changed', (_event, index) => callback(index))
  }
})
