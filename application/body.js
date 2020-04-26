var fs = require('fs');
var ipcRenderer = require('electron').ipcRenderer;

var dates = [];
var currentCalendarYear;
var documentsPath;
var currentDateString = "0000";
var fileExtension = ".jrnl";
var config;
var isPastReadonly = true;

//This file is for all code that runs locally in the webpage

//Saves files to Documents/jrnl Entries
ipcRenderer.on('updateDocPath',(event, arg) => {
    console.log(arg);
    documentsPath = arg + "\\jrnl Entries";
    if(!fs.existsSync(documentsPath)) {
        fs.mkdirSync(documentsPath);
    }

    createPage();
});

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

ipcRenderer.on('setTheme',(event, arg) => {
    config.Settings.CurrentTheme += arg;
    config.Settings.CurrentTheme = config.Settings.CurrentTheme >= config.themes.length ? config.Settings.CurrentTheme - config.themes.length : config.Settings.CurrentTheme < 0 ? config.Settings.CurrentTheme + config.themes.length : config.Settings.CurrentTheme;
    console.log("Setting theme: " + config.Settings.CurrentTheme);
    updateTheme();
});

ipcRenderer.on('updateConfig',(event, arg) => {
    console.log(arg);
    config = arg;

    isPastReadonly = config.Settings.isPastReadOnly;
});

function updateTheme() {
    $('.base').css(config.themes[config.Settings.CurrentTheme].base);
    $('.note-editable').css(config.themes[config.Settings.CurrentTheme].base);
    $('.day').css(config.themes[config.Settings.CurrentTheme].emptyDate);
    updateCalendar();
}

function createPage() {
    //Create summernote instance that autofocuses and uses the minimal ui
    $('#summernote').summernote({
        airMode: true,
        focus: true
    });
    $('.base').css(config.themes[config.Settings.CurrentTheme].base);
    $('.note-editable').css(config.themes[config.Settings.CurrentTheme].base);


    $('#yearSelectPrevious').on('click', function() {setYear(currentCalendarYear - 1)});
    $('#yearSelectNext').on('click', function() {setYear(currentCalendarYear + 1)});

    var date = new Date();
    setYear(date.getFullYear());

    onOpen();
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
        for(var d = 1; d <= dates[m - 1].length; d++) {
            var month = (m < 10 ? '0' : '') + m;
            var date = (d < 10 ? '0' : '') + d;
            htmlText += "<div class='day' id='" + month + date + year + "'></div>";
        }
        htmlText += "</div>";
    }
    htmlText += ""
    $("#calendar").html(htmlText);
    $('.day').css(config.themes[config.Settings.CurrentTheme].emptyDate);

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
 
    if(dates[m-1][d-1]) {
        var month = (m < 10 ? '0' : '') + m;
        var date = (d < 10 ? '0' : '') + d;
        var year = y;
        if((month + "" + date + "" + year) == currentDateString) return;

        if(!isPastReadonly || currentDateString == getTodaysDateString()) {
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
    if(fs.existsSync(documentsPath + "\\" + fileName + fileExtension)) {
        openFile(fileName);
    } else {
        saveFile(fileName);
        updateDateDisplay(fileName);
    }
    currentDateString = fileName;
    updateCalendar();
    updateTheme();
    
}

//updates calendar with colors depending on if entry exists
function updateCalendar() {
    for(var m = 1; m <= dates.length; m++) {
        for(var d = 1; d <= dates[m - 1].length; d++) {
            var month = (m < 10 ? '0' : '') + (m);
            var date = (d < 10 ? '0' : '') + (d);
            var year = currentCalendarYear + "";
            var dateString = month + "" + date + "" + year;
            var datePath = documentsPath + "\\" + dateString + fileExtension;

            if(fs.existsSync(datePath) || dateString == getTodaysDateString()) {
                $("#" + dateString).css(config.themes[config.Settings.CurrentTheme].unselectedEntry);
                dates[m-1][d-1] = true;

                if(currentDateString == dateString) {
                    $("#" + dateString).css(config.themes[config.Settings.CurrentTheme].selectedEntry);
                }

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
    saveConfig();
    saveFile(currentDateString);
})

function saveConfig() {
    fs.writeFileSync("config.json", JSON.stringify(config));
}

function saveFile(name) {

    var content = $("#summernote").summernote('code');
    var fileName = documentsPath + "\\" + name + fileExtension;

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

function openFile(name) {
    
    var filepath = documentsPath + "\\" +  name + fileExtension;
    console.log("Opening file " + filepath);

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
        }
    });
}

//Converts the datestring to a human readable date "MONTH/DATE" 
function updateDateDisplay(dateString) {
    var month = parseInt(dateString.substring(0, 2));
    var date = parseInt(dateString.substring(2, 4));
    var year = parseInt(dateString.substring(4, 8));
    month = (month < 10 ? '0' : '') + month;
    date = (date < 10 ? '0' : '') + date;
    var adjustedName = month + "/" + date + "/" + year;
    $("#date").html(adjustedName);
}
