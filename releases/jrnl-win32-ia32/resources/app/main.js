const { app, BrowserWindow ,Menu, MenuItem} = require('electron')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

const menu = new Menu()

//Create Hotkey for Esc to close application
menu.append(new MenuItem({
  label: 'Quit',
  accelerator: 'Esc',
  click: () => { 
    win.close()
    app.quit()
   }
}))

//Create Hotkey for Ctrl/Cmd+S to save entry
menu.append(new MenuItem({
    label: 'Save',
    accelerator: 'CmdOrCtrl+S',
    click: () => { 
        win.webContents.send('saveFile');
     }
  }))

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 950, height: 600, frame: false, backgroundColor: "#836c89" })

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  //Uncomment this to debug
  //win.webContents.openDevTools()

  //When page loads give it the correct path to save entries
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('updateDocPath', app.getPath('documents'))
  });

  //Setup menu(hotkeys)
  win.setMenu(menu);

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})
