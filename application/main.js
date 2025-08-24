/*
  Developed by Saul Amster
  @Blarfnip
*/

const { app, BrowserWindow ,Menu, MenuItem, Tray, ipcMain, Notification, shell, dialog} = require('electron')

var fs = require('fs');
const path = require('path');
// const notifier = require('node-notifier');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win = null;
let tray = null;

const menu = new Menu()
var defaultConfig = {
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
    "jrnlEntryPath": "",
    "ApplicationScale": 1,
    "CurrentTheme": 3,
    "IsPastReadOnly": true,
    "CloseToTray": true,
    "OpenDebugAtStartup": false,
    "DailyNotifications": {
      "Enabled": true,
      "Time": "07:30 PM",
      "NotificationMessage": "Don't forget to add to your JRNL today!"
    },
    "WindowBounds": {
      "x": 50,
      "y": 50,
      "width": 1300,
      "height": 900
    },
	},
	"Themes": [
		{
			"name": "Dusty Grape",
			"base": {
				"background-color": "#9f7ea8",
				"color": "#1c1c1c"
			},
			"emptyDate": {
				"background-color": "#a99aad"
			},
			"selectedEntry": {
				"background-color": "#ededed"
			},
			"unselectedEntry": {
				"background-color": "#8362a6"
			}
		},
		{
			"name": "Whiteout",
			"base": {
				"background-color": "#fcfcfc",
				"color": "#000000"
			},
			"emptyDate": {
				"background-color": "#d9d9d9"
			},
			"selectedEntry": {
				"background-color": "#aaaaaa"
			},
			"unselectedEntry": {
				"background-color": "#666666"
			}
		},
		{
			"name": "Black Hole",
			"base": {
				"background-color": "#000000",
				"color": "#ffffff"
			},
			"emptyDate": {
				"background-color": "#0f0f0f"
			},
			"selectedEntry": {
				"background-color": "#444444"
			},
			"unselectedEntry": {
				"background-color": "#888888"
			}
		},
		{
      "name": "Just Peachy",
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
			"name": "Slate",
			"base": {
				"background-color": "#363636",
				"color": "#e0e0e0"
			},
			"emptyDate": {
				"background-color": "#212121"
			},
			"selectedEntry": {
				"background-color": "#f0f0f0"
			},
			"unselectedEntry": {
				"background-color": "#888888"
			}
		},
		{
      "name": "Aviator",
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
		},
		{
			"name": "Sub Rosa",
			"base": {
				"background-color": "#ffd7e7",
				"color": "#696161"
			},
			"emptyDate": {
				"background-color": "#f7f7f7"
			},
			"selectedEntry": {
				"background-color": "#404040"
			},
			"unselectedEntry": {
				"background-color": "#969696"
			}
		},
    {
			"name": "Mango",
			"base": {
				"background-color": "#ffcd78",
				"color": "#606169"
			},
			"emptyDate": {
				"background-color": "#948579"
			},
			"selectedEntry": {
				"background-color": "#ffffff"
			},
			"unselectedEntry": {
				"background-color": "#bdbdbd"
			}
		},
    {
			"name": "Verdant",
			"base": {
				"background-color": "#4c7a49",
				"color": "#edede7"
			},
			"emptyDate": {
				"background-color": "#628f5f"
			},
			"selectedEntry": {
				"background-color": "#c7b772"
			},
			"unselectedEntry": {
				"background-color": "#b0b0b0"
			}
		},
    {
			"name": "Ivory",
			"base": {
				"background-color": "#f2f2f2",
				"color": "#404040"
			},
			"emptyDate": {
				"background-color": "#c9c6b6"
			},
			"selectedEntry": {
				"background-color": "#f0be0b"
			},
			"unselectedEntry": {
				"background-color": "#c4a95c"
			}
		},
    {
			"name": "Crimson",
			"base": {
				"background-color": "#5e0f0c",
				"color": "#f5f5f5"
			},
			"emptyDate": {
				"background-color": "#661b0d"
			},
			"selectedEntry": {
				"background-color": "#d9b515"
			},
			"unselectedEntry": {
				"background-color": "#ded1d1"
			}
		},
    {
			"name": "Sea Foam",
			"base": {
				"background-color": "#d0f5f4",
				"color": "#236e62"
			},
			"emptyDate": {
				"background-color": "#b7e1e3"
			},
			"selectedEntry": {
				"background-color": "#1fd6b8"
			},
			"unselectedEntry": {
				"background-color": "#4a5f8c"
			}
		},
	]
};


function createWindow () {
  loadConfig();
}

function loadConfig() {
  var filepath = "config.json";
  console.log("Opening file " + filepath);

  if(fs.existsSync(filepath)) {
    fs.readFile(filepath, 'utf-8', (err, data) => {
      if(err){
        console.error("Error reading config.json:", err);
        loadConfigData(defaultConfig);
        return;
      }
      try {
        let config = JSON.parse(data);
        loadConfigData(config);
      } catch (parseErr) {
        console.error("Error parsing config.json:", parseErr);
        loadConfigData(defaultConfig);
      }
    });
  } else {
    var data = JSON.stringify(defaultConfig, null, "\t");
    fs.writeFile(filepath, data, (err) => {
      if (err) {
        console.error("Error writing default config.json:", err);
        loadConfigData(defaultConfig);
        return;
      }
      loadConfigData(JSON.parse(data));
    });
  }
}

ipcMain.on('reset-config', (event, someArgument) => {
  fs.unlinkSync("config.json");
  let oldWin = win;
  loadConfig();
  oldWin.close();
  event.returnValue = "info";
});

ipcMain.on('toggle-debug', (event, someArgument) => {
  win.toggleDevTools();
  event.returnValue = "info";
});

ipcMain.on('get-folder-path', (event, someArgument) => {
  let path = dialog.showOpenDialogSync({
    properties: ['openDirectory']
  });
  event.returnValue = path;
});

ipcMain.on('is-window-visible', (event, someArgument) => {
  event.returnValue = win.isFocused();
});

ipcMain.on('send-notification', (event, someArgument) => {
  // notifier.notify(
  //   {
  //     title: 'Daily JRNL Reminder',
  //     message: someArgument,
  //     icon: path.join(__dirname, 'jrnlicon.png'), // Absolute path (doesn't work on balloons)
  //     sound: true, // Only Notification Center or Windows Toasters
  //     wait: true // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait or notify-send as it does not support the wait option
  //   },
  //   function (err, response, metadata) {
  //     // Response is response from notification
  //     // Metadata contains activationType, activationAt, deliveredAt
  //   }
  // );
  
  // notifier.on('click', function (notifierObject, options, event) {
  //   win.show();
  //   setTimeout(() => {
  //     win.focus();
  //     win.webContents.send('jumpToToday');
  //   }, 200);
  // });
  
  
  var myNotification = new Notification({
      title: 'Daily JRNL Reminder',
    body: someArgument,
    icon: path.join(__dirname, 'jrnlicon.png'), // Absolute path (doesn't work on balloons)   
  })

  myNotification.show();

  myNotification.on('click', () => {
    win.show();
    setTimeout(() => {
      win.focus();
      win.webContents.send('jumpToToday');
    }, 200);
  });

  event.returnValue = "info";
});

ipcMain.on('minimize-button', (event, someArgument) => {
  win.minimize();
  event.returnValue = "info";
});

ipcMain.on('close-button', (event, someArgument) => {
  win.close();
  event.returnValue = "info";
});

ipcMain.on('open-config-file', (event, someArgument) => {
  shell.openPath(path.join(app.getAppPath(), "config.json"));
  event.returnValue = "info";
});

ipcMain.on('show-config-file', (event, someArgument) => {
  shell.showItemInFolder(path.join(app.getAppPath(), "config.json"));
  event.returnValue = "info";
});

ipcMain.on('show-jrnl-entries', (event, someArgument) => {
  shell.showItemInFolder(someArgument);
  event.returnValue = "info";
});

function loadConfigData(data) {
  //Create Hotkey for Esc to close application
  menu.append(new MenuItem({
    label: 'Quit',
    accelerator: data.Hotkeys.Quit,
    click: () => { 
      win.close()
      app.quit()
    }
  }))

  //Create Hotkey for Ctrl/Cmd+S to save entry
  menu.append(new MenuItem({
    label: 'Save',
    accelerator: data.Hotkeys.Save,
    click: () => { 
        win.webContents.send('saveFile');
    }
  }))

  menu.append(new MenuItem({
    label: 'Export Current Year',
    accelerator: data.Hotkeys.ExportCurrentYear,
    click: () => { 
        win.webContents.send('exportCurrentYear');
    }
  }))

  menu.append(new MenuItem({
    label: 'Previous Year',
    accelerator: data.Hotkeys.PreviousYear,
    click: () => { 
        win.webContents.send('prevYear');
    }
  }))


  menu.append(new MenuItem({
    label: 'Next Year',
    accelerator: data.Hotkeys.NextYear,
    click: () => { 
        win.webContents.send('nextYear');
    }
  }))


  menu.append(new MenuItem({
    label: 'Select Left Entry',
    accelerator: data.Hotkeys.SelectLeftEntry,
    click: () => { 
        win.webContents.send('leftSelection');
    }
  }))

  
  menu.append(new MenuItem({
    label: 'Select Right Entry',
    accelerator: data.Hotkeys.SelectRightEntry,
    click: () => { 
        win.webContents.send('rightSelection');
    }
  }))

  menu.append(new MenuItem({
    label: 'Select Up Entry',
    accelerator: data.Hotkeys.SelectAboveEntry,
    click: () => { 
        win.webContents.send('upSelection');
    }
  }))

  menu.append(new MenuItem({
    label: 'Select Down Entry',
    accelerator: data.Hotkeys.SelectBelowEntry,
    click: () => { 
        win.webContents.send('downSelection');
    }
  }))

  menu.append(new MenuItem({
    label: 'Next Theme',
    accelerator: data.Hotkeys.NextTheme,
    click: () => { 
        win.webContents.send('setTheme', 1);
    }
  }))

  menu.append(new MenuItem({
    label: 'Previous Theme',
    accelerator: data.Hotkeys.PreviousTheme,
    click: () => { 
        win.webContents.send('setTheme', -1);
    }
  }))

  menu.append(new MenuItem({
    label: 'Jump to Today',
    accelerator: data.Hotkeys.JumpToToday,
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
        win.show();
        setTimeout(() => {
          win.focus();
        }, 200);
      }
    })

    // Create myWindow, load the rest of the app, etc...
    // Create the browser window.
    win = new BrowserWindow({
      width: data.Settings.WindowBounds.width,
      height: data.Settings.WindowBounds.height,
      x: data.Settings.WindowBounds.x,
      y: data.Settings.WindowBounds.y,
      frame: false, backgroundColor:
      data.Themes[data.Settings.CurrentTheme].base["background-color"],
      show: false,
      icon: process.platform === 'win32' ? path.resolve(__dirname, 'icon.ico') : path.resolve(__dirname, 'jrnlicon.png'),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      }
    })

    if (process.platform === 'win32')
    {
        app.setAppUserModelId("JRNL");
    }

    if(data.Settings.CloseToTray) {
      tray = new Tray(process.platform === 'win32' ? path.resolve(__dirname, 'icon.ico') : path.resolve(__dirname, 'jrnlicon.png'));
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
    if(data.Settings.OpenDebugAtStartup) {
      win.webContents.openDevTools();
    }
    // win.webContents.openDevTools();


    //When page loads give it the correct path to save entries
    win.webContents.on('did-finish-load', () => {

      if(data.Settings.jrnlEntryPath == "" || !fs.existsSync(data.Settings.jrnlEntryPath)) {
        const sep = process.platform === 'win32' ? '\\' : '/';
        data.Settings.jrnlEntryPath = app.getPath('documents') + sep + "JRNL Entries";
      }

      win.webContents.send('updateConfig', data);
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

    win.on('show', () => {
      win.webContents.send('refreshPage', win.getBounds());
    });


    win.on('close', (event) => {
      win.webContents.send('windowClose', win.getBounds());

      if(data.Settings.CloseToTray) {
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

  win.setBounds(data.Settings.WindowBounds);
  }
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

app.on('ready', () => app.setAppUserModelId("com.electron.jrnl"));

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


