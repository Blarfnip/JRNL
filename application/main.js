const { app, BrowserWindow ,Menu, MenuItem} = require('electron')
var fs = require('fs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

const menu = new Menu()
var config = {
	"Hotkeys": {
		"NextTheme": "Alt+=",
		"NextYear": "Alt+PageDown",
		"PreviousTheme": "Alt+-",
		"PreviousYear": "Alt+PageUp",
		"Quit": "Esc",
		"Save": "CmdOrCtrl+S",
		"SelectAboveEntry": "Alt+Up",
		"SelectBelowEntry": "Alt+Down",
		"SelectLeftEntry": "Alt+Left",
		"SelectRightEntry": "Alt+Right"
	},
	"Settings": {
		"CurrentTheme": 1,
    "IsPastReadOnly": true,
    "WindowBounds": {
      "x": 50,
      "y": 50,
      "width": 950,
      "height": 600
    },
	},
	"themes": [
		{
			"base": {
				"background-color": "#836c89",
				"color": "#e0d5e2",
				"font-family": "'Raleway', sans-serif;"
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
				"color": "#000000",
				"font-family": "'Raleway', sans-serif;"
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
				"color": "#ffffff",
				"font-family": "'Raleway', sans-serif;"
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
				"color": "#7d7572",
				"font-family": "'Raleway', sans-serif;"
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
				"color": "#e6f0fc",
				"font-family": "'Raleway', sans-serif;"
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
  // Create the browser window.
  win = new BrowserWindow({ width: 0, height: 0, frame: false, backgroundColor: "#ffffff" })

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  //Uncomment this to debug
  // win.webContents.openDevTools()


  //When page loads give it the correct path to save entries
  win.webContents.on('did-finish-load', () => {
    loadConfig();
  });

  win.on('resize', () => {
    win.webContents.send('updateConfigWindowSize', win.getBounds());
  });  
  win.on('move', () => {
    win.webContents.send('updateConfigWindowSize', win.getBounds());
  });


  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
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

  win.webContents.send('updateConfig', config);
  win.webContents.send('updateDocPath', app.getPath('documents'));

  //Setup menu(hotkeys)
  win.setMenu(menu);

  win.setBounds(config.Settings.WindowBounds);
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


