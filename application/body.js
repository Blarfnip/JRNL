/*
  Developed by Saul Amster
  @Blarfnip
*/


var fs = require('fs');
const path = require('path'); // Added for cross-platform paths
const { ipcRenderer, webFrame, shell } = require('electron');
// const {dialog} = require('electron').remote;

var dates = [];
var currentCalendarYear;
var documentsPath = "";
var currentDateString = "0000";
var fileExtension = ".jrnl";
var config;
var isPastReadonly = true;
var settingsOpen = false;

var autoSaveInterval;


// $('#baseColorSetting').val(config.Themes[config.Settings.CurrentTheme].base["background-color"]);
// $('#baseTextColorSetting').val(config.Themes[config.Settings.CurrentTheme].base["color"]);
// $('#emptyDateColorSetting').val(config.Themes[config.Settings.CurrentTheme].emptyDate["background-color"]);
// $('#selectedEntryColorSetting').val(config.Themes[config.Settings.CurrentTheme].selectedEntry["background-color"]);
// $('#unselectedEntryColorSetting').val(config.Themes[config.Settings.CurrentTheme].unselectedEntry["background-color"]);

var baseColoris, baseTextColoris, emptyDateColoris, selectedEntryColoris, unselectedEntryColoris;


//This file is for all code that runs locally in the webpage


//Saves file when Ctrl/Cmd+S is pressed
ipcRenderer.on('saveFile',(event, arg) => {
    saveFile(currentDateString);
});

ipcRenderer.on('prevYear',(event, arg) => {
    setYear(currentCalendarYear - 1)
});


ipcRenderer.on('nextYear',(event, arg) => {
    setYear(currentCalendarYear + 1)
});

ipcRenderer.on('leftSelection',(event, arg) => {
    loadNeighboringDate(-1, 0);
});


ipcRenderer.on('rightSelection',(event, arg) => {
    loadNeighboringDate(1, 0);
});

ipcRenderer.on('upSelection',(event, arg) => {
    loadNeighboringDate(0, -1);
});


ipcRenderer.on('downSelection',(event, arg) => {
    loadNeighboringDate(0, 1);
});

ipcRenderer.on('exportCurrentYear',(event, arg) => {
    exportYear(currentCalendarYear);
});

ipcRenderer.on('jumpToToday',(event, arg) => {
    console.log("JUMPING TO TODAY");
    var fileName = getTodaysDateString();

    if (settingsOpen) {
        $("#settings").fadeOut();
        settingsOpen = false;
    }

    if(autoSaveInterval != null) {
        clearInterval(autoSaveInterval);
    }

    //If there exists an entry for today, open it. Else create a new entry.
    if(fs.existsSync(path.join(documentsPath, fileName + fileExtension))) {
        openFile(fileName);
    } else {
        saveFile(currentDateString);
        openFile(fileName);
        updateDateDisplay(fileName);
    }
    currentDateString = fileName;
    updateCalendar();
});

ipcRenderer.on('refreshPage',(event, arg) => {
    // console.log(arg);
    let fileName = currentDateString;

    // Refresh the page if the page is not today's date incase it is no longer editable
    if(isPastReadonly && fileName != getTodaysDateString()) {
        $("#summernote").summernote('disable');
    } else {
        $("#summernote").summernote('enable');
        setTimeout(function() {
            $('.note-editable').trigger('focus');
        }, 100);
    }
});

ipcRenderer.on('windowClose',(event, arg) => {
    if(autoSaveInterval != null) {
        clearInterval(autoSaveInterval);
    }

    saveConfig();
    saveFile(currentDateString);
});


function setDateTest(date) {
    setTimeout(() => {
        currentDateString = date;
    }, 15000);
}

ipcRenderer.on('updateConfigWindowSize',(event, arg) => {
    // console.log(arg);
    config.Settings.WindowBounds = arg;
});

ipcRenderer.on('setTheme',(event, arg) => {
    config.Settings.CurrentTheme += arg;
    config.Settings.CurrentTheme = config.Settings.CurrentTheme >= config.Themes.length ? config.Settings.CurrentTheme - config.Themes.length : config.Settings.CurrentTheme < 0 ? config.Settings.CurrentTheme + config.Themes.length : config.Settings.CurrentTheme;
    console.log("Setting theme: " + config.Settings.CurrentTheme);
    updateTheme();
});

ipcRenderer.on('updateConfig',(event, arg) => {
    console.log(arg);
    config = arg;

    updateTheme();

    updateDocumentsPath(config.Settings.jrnlEntryPath);

    createPage();

    isPastReadonly = config.Settings.IsPastReadOnly;

    if(config.Settings.DailyNotifications.Enabled) {
        setInterval(sendNotification, 60 * 1000);
    }
});

function updateDocumentsPath(newPath) {
    console.log("Updating entry path: " + newPath);
    if(!fs.existsSync(newPath)) {
        fs.mkdirSync(newPath, { recursive: true });
    }

    // Take care of old path
    if(documentsPath != "") {
        fs.readdirSync(documentsPath).forEach(file => {
            if(file.endsWith(fileExtension)) {
                fs.copyFileSync(
                    path.join(documentsPath, file),
                    path.join(newPath, file)
                );
            }
        });
    }

    // New Path
    documentsPath = newPath;
}



function updateTheme() {
    $('.base').css(config.Themes[config.Settings.CurrentTheme].base);
    $('.note-editable').css(config.Themes[config.Settings.CurrentTheme].base);
    $('.settings').css(config.Themes[config.Settings.CurrentTheme].base);
    $('.day').css(config.Themes[config.Settings.CurrentTheme].emptyDate);
    $('.titlebarButton').css(config.Themes[config.Settings.CurrentTheme].selectedEntry);
    $('.yearButton').css(config.Themes[config.Settings.CurrentTheme].selectedEntry);
    
    $('#currentTheme').val(config.Settings.CurrentTheme);

    // Update settings color pickers
    $('#baseColorSetting').val(config.Themes[config.Settings.CurrentTheme].base["background-color"]);
    $('#baseTextColorSetting').val(config.Themes[config.Settings.CurrentTheme].base["color"]);
    $('#emptyDateColorSetting').val(config.Themes[config.Settings.CurrentTheme].emptyDate["background-color"]);
    $('#selectedEntryColorSetting').val(config.Themes[config.Settings.CurrentTheme].selectedEntry["background-color"]);
    $('#unselectedEntryColorSetting').val(config.Themes[config.Settings.CurrentTheme].unselectedEntry["background-color"]);

    $('#baseColorSetting').parent().css({color: config.Themes[config.Settings.CurrentTheme].base["background-color"]});
    $('#baseTextColorSetting').parent().css({color: config.Themes[config.Settings.CurrentTheme].base["color"]});
    $('#emptyDateColorSetting').parent().css({color: config.Themes[config.Settings.CurrentTheme].emptyDate["background-color"]});
    $('#selectedEntryColorSetting').parent().css({color: config.Themes[config.Settings.CurrentTheme].selectedEntry["background-color"]});
    $('#unselectedEntryColorSetting').parent().css({color: config.Themes[config.Settings.CurrentTheme].unselectedEntry["background-color"]});

    updateCalendar();
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    var x = result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 1
    } : null;

    return `rgb(${x.r},${x.g},${x.b})`;
  }

function createPage() {
    //Create summernote instance that autofocuses and uses the minimal ui
    $('#summernote').summernote({
        airMode: true,
        focus: true,  // toolbar
        popover: {
            air: [
                ['style', ['style']],
                ['font', ['bold', 'italic', 'underline', 'clear']],
                // ['font', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
                ['fontsize', ['fontsize']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['height', ['height']],
                ['table', ['table']],
                ['insert', ['link', 'picture', 'hr']],
            ],
        }
    });
    $('.base').css(config.Themes[config.Settings.CurrentTheme].base);
    $('.note-editable').css(config.Themes[config.Settings.CurrentTheme].base);

    $("#save").hide();
    $('#settings').hide();

    $('#yearSelectPrevious').on('click', function() {setYear(currentCalendarYear - 1)});
    $('#yearSelectNext').on('click', function() {setYear(currentCalendarYear + 1)});


    $('#settingsBackButton').on('click', function() {
        $('#settings').fadeOut();
        settingsOpen = false;
    });

    $('#settingsButton').on('click', function() {
        $('#settings').fadeToggle();
        settingsOpen = !settingsOpen;
    });

    setupSettings();
    setupSettingHints();

    webFrame.setZoomFactor(config.Settings.ApplicationScale);


    $('#minimize').on('click', function() { 
        console.log("MINIMIZE");
        // remote.BrowserWindow.getFocusedWindow().minimize();
        ipcRenderer.sendSync("minimize-button").returnValue;
    });
    $('#exit').on('click', function() {
        console.log("EXIT");
        // const win = remote.BrowserWindow.getFocusedWindow();
        // win.close();
        // win.quit();
        ipcRenderer.sendSync("close-button").returnValue;
    });

    $(document).on("keydown", function (e) {
        if(autoSaveInterval != null) {
            clearInterval(autoSaveInterval);
        }

        $("#save").show();

        autoSaveInterval = setTimeout(() => {
            // let isVisible = ipcRenderer.sendSync("is-window-visible");
            // console.log(isVisible);
            // if (isVisible) {
                saveFile(currentDateString);
            // } else {
            //     $("#save").hide();
            // }
        }, 10 * 1000);
    });

    var date = new Date();
    setYear(date.getFullYear());
    // populateYear();
    onOpen();
}

function setupSettings() {

    $('#baseColorSetting').val(config.Themes[config.Settings.CurrentTheme].base["background-color"]);
    $('#baseTextColorSetting').val(config.Themes[config.Settings.CurrentTheme].base["color"]);
    $('#emptyDateColorSetting').val(config.Themes[config.Settings.CurrentTheme].emptyDate["background-color"]);
    $('#selectedEntryColorSetting').val(config.Themes[config.Settings.CurrentTheme].selectedEntry["background-color"]);
    $('#unselectedEntryColorSetting').val(config.Themes[config.Settings.CurrentTheme].unselectedEntry["background-color"]);

    $('#notificationsEnabled').prop('checked', config.Settings.DailyNotifications.Enabled);
    $('#timepicker').val(config.Settings.DailyNotifications.Time);
    $('#notificationMessage').val(config.Settings.DailyNotifications.NotificationMessage);

    $('#isPastReadOnly').prop('checked', !config.Settings.IsPastReadOnly);
    $('#closeToTray').prop('checked', config.Settings.CloseToTray);

    $('#applicationScale').val(config.Settings.ApplicationScale);

    var currentThemeSelector = $('#currentTheme');
    $.each(config.Themes, function(val, text) {
        currentThemeSelector.append(
            $('<option></option>').val(val).html(text.name)
        );
    });

    $('#currentTheme').val(config.Settings.CurrentTheme);

    $('#entryPath').html(config.Settings.jrnlEntryPath);

    baseColoris = Coloris({
        el: '#baseColorSetting',
        format: 'hex',
        alpha: false
    });

    baseTextColoris = Coloris({
        el: '#baseTextColorSetting',
        format: 'hex',
        alpha: false
    });

    emptyDateColoris = Coloris({
        el: '#emptyDateColorSetting',
        format: 'hex',
        alpha: false
    });

    selectedEntryColoris = Coloris({
        el: '#selectedEntryColorSetting',
        format: 'hex',
        alpha: false
    });

    unselectedEntryColoris = Coloris({
        el: '#unselectedEntryColorSetting',
        format: 'hex',
        alpha: false
    });
    

    mdtimepicker('#timepicker');

    $('#applicationScale').rangeslider({polyfill: false});


    $('#baseTextColorSetting').on('input', function() {
        config.Themes[config.Settings.CurrentTheme].base = {
            "background-color": $('#baseColorSetting').val(),
            "color": $('#baseTextColorSetting').val()
        };
        updateTheme();
    });

    $('#baseColorSetting').on('input', function() {
        config.Themes[config.Settings.CurrentTheme].base = {
            "background-color": $('#baseColorSetting').val(),
            "color": $('#baseTextColorSetting').val()
        };
        updateTheme();
    });

    $('#emptyDateColorSetting').on('input', function() {
        config.Themes[config.Settings.CurrentTheme].emptyDate = {
            "background-color": $('#emptyDateColorSetting').val()
        };
        updateTheme();
    });

    $('#selectedEntryColorSetting').on('input', function() {
        config.Themes[config.Settings.CurrentTheme].selectedEntry = {
            "background-color": $('#selectedEntryColorSetting').val()
        };
        updateTheme();
    });

    $('#unselectedEntryColorSetting').on('input', function() {
        config.Themes[config.Settings.CurrentTheme].unselectedEntry = {
            "background-color": $('#unselectedEntryColorSetting').val()
        };
        updateTheme();
    });

    currentThemeSelector.on('change', function() {
        config.Settings.CurrentTheme = currentThemeSelector.val();
        updateTheme();
    });

    $('#notificationsEnabled').on('change', function() {
        config.Settings.DailyNotifications.Enabled = $('#notificationsEnabled').prop('checked');
    });

    $('#notificationMessage').on('change', function() {
        config.Settings.DailyNotifications.NotificationMessage = $('#notificationMessage').val();
    });

    $('#timepicker').on('change', function() {
        config.Settings.DailyNotifications.Time = $('#timepicker').val();
    });

    $('#testNotification').on("click", function() {
        fireNotification();
    });

    $('#isPastReadOnly').on('change', function() {
        config.Settings.IsPastReadOnly = !$('#isPastReadOnly').prop('checked');
        isPastReadonly = config.Settings.IsPastReadOnly;
    });

    $('#closeToTray').on('change', function() {
        config.Settings.CloseToTray = $('#closeToTray').prop('checked');
    });

    $('#applicationScale').on('change', function() {
        console.log($('#applicationScale').val());
        config.Settings.ApplicationScale = (Number)($('#applicationScale').val());
        webFrame.setZoomFactor(config.Settings.ApplicationScale);
    });

    $('#resetToDefault').on('click', function() {
        ipcRenderer.sendSync("reset-config");
    });

    $('#openConfigFile').on('click', function() {
        ipcRenderer.sendSync("open-config-file");
    });

    $('#showConfigFile').on('click', function() {
        ipcRenderer.sendSync("show-config-file");
    });

    $('#openEntryPathButton').on('click', function() {
        ipcRenderer.sendSync("show-jrnl-entries", documentsPath);
    });
    
    $('#toggleDebugMode').on('click', function() {
        ipcRenderer.sendSync("toggle-debug");
    });

    $('#entryPathButton').on('click', function() {
        // var path = dialog.showOpenDialog({
        //     properties: ['openDirectory']
        // });
        let folderPath = ipcRenderer.sendSync("get-folder-path");
        console.log(folderPath);

        if(folderPath != undefined && folderPath != "") {
            config.Settings.jrnlEntryPath = path.join(folderPath, "JRNL Entries");
            updateDocumentsPath(config.Settings.jrnlEntryPath);
            $('#entryPath').html(config.Settings.jrnlEntryPath);
        }
    });


}

function setupSettingHints() {
    $("#arePreviousEntriesEditableSetting").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Are Previous Entries Editable?</h4>
                This setting determines if previous entries can be edited.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#closeJRNLToTraySetting").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Close to Tray</h4>
                Enabling this setting causes the app to minimize to the system tray when closed.
                <br><br>
                <b>This is required for notificatons to work.</b>
                <br><br>
                JRNL must be restarted for changes to this setting to take effect.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#applicationScaleSetting").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Application Scale</h4>
                Scales the entire UI by this factor.
                <br><br>
                Use this if the font size is too small.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#notificationEnabledSetting").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Notifications Enabled</h4>
                Enable this for daily notifications.
                <br><br>
                <b>Requires "Close to Tray" to be enabled.</b>
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#notificationTimeSetting").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Notification Time</h4>
                This setting controls the time of day that the daily notification occurs.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#notificationMessageSetting").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Notification Message</h4>
                Change the message that appears in the daily notification.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#currentThemeSetting").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Current Theme</h4>
                Select one of the themes from the config file. 
                <br><br>
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#baseTextColorSettingHint").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Base Text Color</h4>
                This modifies the text color of the entire app for the current theme.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#baseColorSettingHint").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Base Color</h4>
                This modifies the background color of the entire app for the current theme.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#emptyDateSettingHint").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Empty Date Color</h4>
                This modifies the color of dates on the calendar that do not have
                 entries associated to them for the current theme.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#selectedEntrySettingHint").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Selected Entry Color</h4>
                This modifies the color of the selected entry on the calendar for the current theme.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#unselectedEntryColorSettingHint").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Unselected Entry Color</h4>
                This modifies the color of all the unselected entries on the calendar for the current theme.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#entryPathButton").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Current JRNL Entry Folder Location</h4>
                Change the folder where JRNL entries are stored.
                <br><br>
                Changing folders will copy all existing entries from the current folder into a new "JRNL Entries" folder at the selected destination.
                <br><br>
                <b>You must manually delete the old "JRNL Entries" folder.</b>
                <br><br>
                The default location is "...\\Documents\\JRNL Entries"
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#openEntryPathButton").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Open JRNL Entry Folder Location</h4>
                Highlight the JRNL Entry folder in the default file explorer.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#configFileSettings").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Config Settings</h4>
                To access more advanced settings, you must directly modify the config.json file.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#resetToDefault").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Reset Settings to Default</h4>
                This will reset the config file to its default values and restart the app. 
                <br><br>
                This does not delete any JRNL entries but it will reset the JRNL folder location to
                the default.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });

    $("#toggleDebugMode").on({
        mouseenter: function () {
            $("#settingsDescription").html(`
                <h4>Toggle Debug Console</h4>
                This will toggle the developer console. It is not recommened to use this unless you know what you're doing.
            `);
        },
        mouseleave: function () {
            $("#settingsDescription").html("");
        }
    });
}

function formatAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes.toString().padStart(2, '0');
    let strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  }

function sendNotification() {
    let d = new Date();

    if(config.Settings.DailyNotifications.Time == formatAMPM(d)) {
        fireNotification();
    }

}

function fireNotification() {
    console.log("SENDING NOTIFICATION")

    console.log(config.Settings.DailyNotifications.Time);

    ipcRenderer.sendSync("send-notification", config.Settings.DailyNotifications.NotificationMessage);


    // let d = new Date();

    // console.log(formatAMPM(d));
    

    // let myNotification = new Notification('Daily JRNL Reminder', {
    //     body: config.Settings.DailyNotifications.NotificationMessage
    // })

    // myNotification.show();

    // myNotification.onclick = () => {
    //     remote.BrowserWindow.getAllWindows()[0].show();
    // }
}

function buildCalendar() {
    dates = [];

    //Manually build the calendar
    dates.push(createArray(31)); //January
    if(currentCalendarYear % 4 == 0)
        dates.push(createArray(29)); //February
    else
        dates.push(createArray(28)); //February
    dates.push(createArray(31)); //March
    dates.push(createArray(30)); //April
    dates.push(createArray(31)); //May
    dates.push(createArray(30)); //June
    dates.push(createArray(31)); //July
    dates.push(createArray(31)); //August
    dates.push(createArray(30)); //September
    dates.push(createArray(31)); //October
    dates.push(createArray(30)); //November
    dates.push(createArray(31)); //December

    createCalendar(dates, currentCalendarYear);

}

function setYear(year) {
    currentCalendarYear = year;   
    console.log("Setting year: " + year); 
    $('#yearDisplay').html(year + "");

    buildCalendar();
    updateCalendar();
}

//Constructs the calendar
function createCalendar(dates, year) {
    //Builds the html for the calendar
    var htmlText = "";
    for(var m = 1; m <= dates.length; m++) {
        htmlText += "<div class = 'monthCol'>";
        htmlText += "<div class='monthLetter noselect'>"+ months[m-1].substring(0,1) +"</div>";
        for(var d = 1; d <= dates[m - 1].length; d++) {
            var month = (m < 10 ? '0' : '') + m;
            var date = (d < 10 ? '0' : '') + d;
            htmlText += "<div class='day' id='" + month + date + year + "'></div>";
        }
        htmlText += "</div>";
    }
    htmlText += ""
    $("#calendar").html(htmlText);
    $('.day').css(config.Themes[config.Settings.CurrentTheme].emptyDate);

    //Binds a click listener so each button opens its entry
    document.getElementById("calendar").addEventListener("click",function(e) {
        for(var m = 1; m <= dates.length; m++) {
            for(var d = 1; d <= dates[m - 1].length; d++) {
                var month = (m < 10 ? '0' : '') + m;
                var date = (d < 10 ? '0' : '') + d;
                if(e.target && e.target.id == month +""+ date+""+year) {
                    loadOtherDate(m, d, year);
                    updateCalendar();
                }
            }
        }
    });

}

function loadNeighboringDate(x, y) {
    var foundOption = false;

    var currentMonth = parseInt(currentDateString.substring(0, 2));
    var currentYear = currentCalendarYear;
    var currentDay = parseInt(currentDateString.substring(2, 4));
    var offset = 1;

    if(y == 0) {
        for(var m = currentMonth + x, k = 0; k < dates.length; m += x, k++) {
            m = m < 1 ? m + 12 : m > 12 ? m - 12 : m;
            offset = 0;
    
            for(var d = currentDay + offset, i = 0; i < dates[m-1].length; d += offset, i++) {
                d = d < 1 ? d + dates[m-1].length : d > dates[m-1].length ? d - dates[m-1].length : d;
                offset = (-1) * (offset + (offset >= 0 ? 1 : -1));
                if(dates[m-1][d-1]) {
                    loadOtherDate(m, d, currentYear);
                    updateCalendar();
                    console.log("FOUND: " + m + " " + d + " " + currentYear);
                    foundOption = true;
                    break;
                }
            }
            if(foundOption) {
                break;
            }
        }    
    } else if(x == 0) {
        for(var d = currentDay + y, k = 0; k < 31; d += y, k++) {
            d = d < 1 ? d + 31 : d > 31 ? d - 31 : d;
            offset = 0;
    
            for(var m = currentMonth + offset, i = 0; i < dates.length; m += offset, i++) {
                m = m < 1 ? m + 12 : m > 12 ? m - 12 : m;
                offset = (-1) * (offset + (offset >= 0 ? 1 : -1));
                if(dates[m-1][d-1]) {
                    loadOtherDate(m, d, currentYear);
                    updateCalendar();
                    console.log("FOUND: " + m + " " + d + " " + currentYear);
                    foundOption = true;
                    break;
                }
            }
            if(foundOption) {
                break;
            }
        } 
    }
    
}

//loads entry
function loadOtherDate(m, d, y) {
 
    if(!isPastReadonly || dates[m-1][d-1]) {
        var month = (m < 10 ? '0' : '') + m;
        var date = (d < 10 ? '0' : '') + d;
        var year = y;
        if((month + "" + date + "" + year) == currentDateString) return;

        if(!isPastReadonly || currentDateString == getTodaysDateString()) {
            if(autoSaveInterval != null) {
                clearInterval(autoSaveInterval);
            }

            saveFile(currentDateString);
        }
        currentDateString = month + "" + date + "" + year;
        openFile(currentDateString);
    }
}

//returns date string for current day
function getTodaysDateString() {
    var date = new Date();
    var m = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
    var d = (date.getDate() < 10 ? '0' : '') + date.getDate();
    var y = date.getFullYear();
    return m + "" + d + "" + y;
}


//Called when the application opens
function onOpen() {
    var fileName = getTodaysDateString();

    //If there exists an entry for today, open it. Else create a new entry.
    if(fs.existsSync(path.join(documentsPath, fileName + fileExtension))) {
        openFile(fileName);
    } else {
        saveFile(fileName);
        updateDateDisplay(fileName);
    }
    currentDateString = fileName;
    updateCalendar();
    setTimeout(() => {$('.loadScreen').fadeOut(500);}, 500);
}

//updates calendar with colors depending on if entry exists
function updateCalendar() {
    for(var m = 1; m <= dates.length; m++) {
        for(var d = 1; d <= dates[m - 1].length; d++) {
            var month = (m < 10 ? '0' : '') + (m);
            var date = (d < 10 ? '0' : '') + (d);
            var year = currentCalendarYear + "";
            var dateString = month + "" + date + "" + year;
            var datePath = path.join(documentsPath, dateString + fileExtension);

            if(fs.existsSync(datePath) || dateString == getTodaysDateString()) {
                $("#" + dateString).css(config.Themes[config.Settings.CurrentTheme].unselectedEntry);
                dates[m-1][d-1] = true;
            } else {
                $("#" + dateString).css(config.Themes[config.Settings.CurrentTheme].emptyDate);
            }

            if(currentDateString == dateString) {
                $("#" + dateString).css(config.Themes[config.Settings.CurrentTheme].selectedEntry);
            }
        }
    }
}

//Creates 1D array filled with false
function createArray(size) {
    var arr = [];
    for(var i = 0; i < size; i++) {
        arr.push(false);
    }
    return arr;
}

//Save on close
window.addEventListener('unload', function(event) {
    
})

// remote.getCurrentWindow().on('close', (e) => {
//     saveConfig();
//     saveFile(currentDateString);
// })


function saveConfig() {
    fs.writeFileSync("config.json", JSON.stringify(config, null, "\t"));
}

function saveFile(name) {
    var content = $("#summernote").summernote('code');
    var fileName = path.join(documentsPath, name + fileExtension);

    $("#save").hide();

    if($("#summernote").summernote('isEmpty')) {
        if(fs.existsSync(fileName)) {
            fs.unlinkSync(fileName);
        }

        ipcRenderer.send('done-saving');
        console.log("No content to save. Aborted. " + fileName);
        return;
    } else {
        fs.writeFile(fileName, content, function (err) {
            if(err){
                alert("An error ocurred creating the file "+ err.message)
            }
            
            console.log("The file has been succesfully saved at " + fileName);
        });
    
        ipcRenderer.send('done-saving');
    
    }

}

function populateYear() {
    for(var m = 0; m < dates.length; m++) {
        for(var d = 0; d < dates[m].length; d++) {
            var month = (m < 10 ? '0' : '') + (m);
            var date = (d < 10 ? '0' : '') + (d);
            var year = currentCalendarYear + "";
            var dateString = month + "" + date + "" + year; 
            var filename = documentsPath + "\\" + dateString + fileExtension;
            if(!fs.existsSync(dateString)) {
                if(Math.random() > 0.9) {
                    fs.writeFileSync(filename, "TEST");
               }
            }
        }
    }
}

function openFile(name) {
    var filepath = path.join(documentsPath, name + fileExtension);
    console.log("Opening file " + filepath);

    if(fs.existsSync(filepath)) {
        fs.readFile(filepath, 'utf-8', (err, data) => {
            if(err){
                alert("An error ocurred reading the file :" + err.message);
                return;
            }
    
            // Change how to handle the file content
            updateDateDisplay(name);
    
            $("#summernote").summernote('code', data);
    
            if(isPastReadonly && name != getTodaysDateString()) {
                $("#summernote").summernote('disable');
            } else {
                $("#summernote").summernote('enable');
                setTimeout(function() {
                    $('.note-editable').trigger('focus');
                }, 100);
            }
        });    
    } else {
            var data = "";
            // Change how to handle the file content
            updateDateDisplay(name);
    
            $("#summernote").summernote('code', data);
    
            if(isPastReadonly && name != getTodaysDateString()) {
                $("#summernote").summernote('disable');
            } else {
                $("#summernote").summernote('enable');
                setTimeout(function() {
                    $('.note-editable').trigger('focus');
                }, 100);
            }
    }

}


//Converts the datestring to a human readable date "MONTH/DATE" 
const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
]
function updateDateDisplay(dateString) {
    var month = parseInt(dateString.substring(0, 2));
    var date = parseInt(dateString.substring(2, 4));
    var year = parseInt(dateString.substring(4, 8));
    //month = (month < 10 ? '0' : '') + month;
    date = (date < 10 ? '0' : '') + date;
    var adjustedName = months[month - 1] + " " + date + ", " + year;
    $("#date").html(adjustedName);
}

function exportYear(year) {
    let exportPath = path.join(documentsPath, year + ".html");
    let exportedMarkdown = "<h1><b>JRNL " + year + "</b></h1> <p><hr><p>";

    for(var m = 0; m < dates.length; m++) {
        for(var d = 0; d < dates[m].length; d++) {
            var month = (m < 10 ? '0' : '') + (m);
            var date = (d < 10 ? '0' : '') + (d);
            var dateString = month + "" + date + "" + year; 
            var adjustedName = months[month - 1] + " " + date + ", " + year;
            var filename = path.join(documentsPath, dateString + fileExtension);
            if(fs.existsSync(filename)) {
                exportedMarkdown += "<hr><h1>" + adjustedName + "</h1><p>";
                exportedMarkdown += fs.readFileSync(filename, 'utf-8').replace('`', "'") + "<p>";
            }
        }
    }

    let exportedFile = `
        <head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.min.js"></script>
            <style>
                body {
                    ` + JSON.stringify(config.Themes[config.Settings.CurrentTheme].base).replace(/\{/g, '').replace(/\}/g, '').replace(/\",/g, ';\n').replace(/\"/g, '') + `
                }
                .contents {
                    padding: 2%;
                }
            </style>
        </head>
        <body>
            <div id="contents" class="contents"></div>
            <script>
                var converter = new showdown.Converter(),
                    text      = \`` + exportedMarkdown + `\`,
                    html      = converter.makeHtml(text);

                document.getElementById("contents").innerHTML = html;
            </script>
        </body>
    `;

    fs.writeFile(exportPath, exportedFile, function (err) {
        if(err){
            alert("An error ocurred creating the file "+ err.message)
        }

        let myNotification = new Notification('JRNL', {
            body: year + " Year exported to " + exportPath
        })
    
        myNotification.onclick = () => {
            shell.showItemInFolder(exportPath);
        }

        shell.showItemInFolder(exportPath);
        
        console.log("The file has been succesfully saved at " + exportPath);
    });
}
