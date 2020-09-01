/*
  Developed by Saul Amster
  @Blarfnip
*/

const { app, BrowserWindow ,Menu, MenuItem, Tray} = require('electron')
var fs = require('fs');
const path = require('path');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win = null;
let tray = null;

const menu = new Menu()
var config = {
	"Hotkeys": {
		"NextTheme": "Alt+=",
		"NextYear": "Alt+PageDown",
		"PreviousTheme": "Alt+-",
		"PreviousYear": "Alt+PageUp",
		"Quit": "Esc",
		"Save": "CmdOrCtrl+S",
		"ExportCurrentYear": "Alt+CmdOrCtrl+Y",
		"SelectAboveEntry": "Alt+Up",
		"SelectBelowEntry": "Alt+Down",
		"SelectLeftEntry": "Alt+Left",
    "SelectRightEntry": "Alt+Right",
    "JumpToToday": "Home"
	},
	"Settings": {
    "CurrentTheme": 3,
    "IsPastReadOnly": true,
    "CloseToTray": true,
    "DailyNotifications": {
      "Enabled": true,
      "Time": "07:30pm",
      "NotificationMessage": "Don't forget to add to your JRNL today!"
    },
    "WindowBounds": {
      "x": 50,
      "y": 50,
      "width": 950,
      "height": 600
    },
	},
	"Themes": [
		{
			"base": {
				"background-color": "#836c89",
				"color": "#e0d5e2"
			},
			"emptyDate": {
				"background-color": "#a99aad"
			},
			"selectedEntry": {
				"background-color": "#dbace2"
			},
			"unselectedEntry": {
				"background-color": "#93bbd6"
			}
		},
		{
			"base": {
				"background-color": "#ffffff",
				"color": "#000000"
			},
			"emptyDate": {
				"background-color": "#222222"
			},
			"selectedEntry": {
				"background-color": "#aaaaaa"
			},
			"unselectedEntry": {
				"background-color": "#666666"
			}
		},
		{
			"base": {
				"background-color": "#000000",
				"color": "#ffffff"
			},
			"emptyDate": {
				"background-color": "#dddddd"
			},
			"selectedEntry": {
				"background-color": "#444444"
			},
			"unselectedEntry": {
				"background-color": "#888888"
			}
		},
		{
			"base": {
				"background-color": "#fcebe6",
				"color": "#7d7572"
			},
			"emptyDate": {
				"background-color": "#c9bcb7"
			},
			"selectedEntry": {
				"background-color": "#805648"
			},
			"unselectedEntry": {
				"background-color": "#fdb39a"
			}
		},
		{
			"base": {
				"background-color": "#214c80",
				"color": "#e6f0fc"
			},
			"emptyDate": {
				"background-color": "#72777d"
			},
			"selectedEntry": {
				"background-color": "#9ac7fd"
			},
			"unselectedEntry": {
				"background-color": "#b7bfc9"
			}
		}
	]
};


function createWindow () {
  loadConfig();
}

function loadConfig() {
  var filepath = "config.json";
  console.log("Opening file " + filepath);

  if(fs.existsSync("config.json")) {
    fs.readFile(filepath, 'utf-8', (err, data) => {
      if(err){
          return;
      }
      
      config = JSON.parse(data);
      loadConfigData(config);
    });
  } else {
    var data = JSON.stringify(config, null, "\t");
    fs.writeFile("config.json", data, (err) => {
      loadConfigData(config);
    });
  }
}

function loadConfigData(data) {
  //Create Hotkey for Esc to close application
  menu.append(new MenuItem({
    label: 'Quit',
    accelerator: config.Hotkeys.Quit,
    click: () => { 
      win.close()
      app.quit()
    }
  }))

  //Create Hotkey for Ctrl/Cmd+S to save entry
  menu.append(new MenuItem({
    label: 'Save',
    accelerator: config.Hotkeys.Save,
    click: () => { 
        win.webContents.send('saveFile');
    }
  }))

  menu.append(new MenuItem({
    label: 'Export Current Year',
    accelerator: config.Hotkeys.ExportCurrentYear,
    click: () => { 
        win.webContents.send('exportCurrentYear');
    }
  }))

  menu.append(new MenuItem({
    label: 'Previous Year',
    accelerator: config.Hotkeys.PreviousYear,
    click: () => { 
        win.webContents.send('prevYear');
    }
  }))


  menu.append(new MenuItem({
    label: 'Next Year',
    accelerator: config.Hotkeys.NextYear,
    click: () => { 
        win.webContents.send('nextYear');
    }
  }))


  menu.append(new MenuItem({
    label: 'Select Left Entry',
    accelerator: config.Hotkeys.SelectLeftEntry,
    click: () => { 
        win.webContents.send('leftSelection');
    }
  }))

  
  menu.append(new MenuItem({
    label: 'Select Right Entry',
    accelerator: config.Hotkeys.SelectRightEntry,
    click: () => { 
        win.webContents.send('rightSelection');
    }
  }))

  menu.append(new MenuItem({
    label: 'Select Up Entry',
    accelerator: config.Hotkeys.SelectAboveEntry,
    click: () => { 
        win.webContents.send('upSelection');
    }
  }))

  menu.append(new MenuItem({
    label: 'Select Down Entry',
    accelerator: config.Hotkeys.SelectBelowEntry,
    click: () => { 
        win.webContents.send('downSelection');
    }
  }))

  menu.append(new MenuItem({
    label: 'Next Theme',
    accelerator: config.Hotkeys.NextTheme,
    click: () => { 
        win.webContents.send('setTheme', 1);
    }
  }))

  menu.append(new MenuItem({
    label: 'Previous Theme',
    accelerator: config.Hotkeys.PreviousTheme,
    click: () => { 
        win.webContents.send('setTheme', -1);
    }
  }))

  menu.append(new MenuItem({
    label: 'Jump to Today',
    accelerator: config.Hotkeys.JumpToToday,
    click: () => { 
        win.webContents.send('jumpToToday');
    }
  }))

  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    app.quit()
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()
      }
    })

    // Create myWindow, load the rest of the app, etc...
    // Create the browser window.
    win = new BrowserWindow({
      width: config.Settings.WindowBounds.width,
      height: config.Settings.WindowBounds.width,
      x: config.Settings.WindowBounds.x,
      y: config.Settings.WindowBounds.y,
      frame: false, backgroundColor:
      config.Themes[config.Settings.CurrentTheme].base["background-color"],
      show: false,
      icon: path.resolve(__dirname, 'icon.ico')
    })


    if(config.Settings.CloseToTray) {
      tray = new Tray(path.resolve(__dirname, 'icon.ico'))
      const contextMenu = Menu.buildFromTemplate([
        new MenuItem({
          label: "Open",
          click: () => {
            win.show();
          }
        }),
        new MenuItem({
          label: 'Export Current Year',
          click: () => { 
              win.webContents.send('exportCurrentYear');
          }
        }),
        new MenuItem({
          label: "Quit",
          click: () => {
            win.close();
            win.destroy();
            app.quit();
          }
        })
      ])
      tray.setToolTip('JRNL')
      tray.on('click', (e) => {
        win.show();
      })
      tray.setContextMenu(contextMenu)
    
    }
    

    // and load the index.html of the app.
    win.loadURL(`file://${__dirname}/index.html`)

    // Open the DevTools.
    //Uncomment this to debug
    // win.webContents.openDevTools()


    //When page loads give it the correct path to save entries
    win.webContents.on('did-finish-load', () => {
      win.webContents.send('updateConfig', config);
      win.webContents.send('updateDocPath', app.getPath('documents'));
    });

    win.on('ready-to-show', () => {
      setTimeout(() => {win.show()}, 500);
    });

    win.on('resize', () => {
      win.webContents.send('updateConfigWindowSize', win.getBounds());
    });  
    win.on('move', () => {
      win.webContents.send('updateConfigWindowSize', win.getBounds());
    });


    win.on('close', (event) => {
        if(config.Settings.CloseToTray) {
          event.preventDefault();
          win.hide();
        }
    });

    // Emitted when the window is closed.
    win.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      win = null
  })


  //Setup menu(hotkeys)
  win.setMenu(menu);

  win.setBounds(config.Settings.WindowBounds);
  }

  
  
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


