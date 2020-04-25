var fs = require('fs');
var ipcRenderer = require('electron').ipcRenderer;

var dates = [];
var currentCalendarYear;
var documentsPath;
var currentDateString = "0000";
var fileExtension = ".jrnl";
var filledColor = "#93bbd6";
var highLightedColor = "#dbace2";
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

//Saves file when Ctrl/Cmd+S is pressed
ipcRenderer.on('prevYear',(event, arg) => {
    setYear(currentCalendarYear - 1)
});


//Saves file when Ctrl/Cmd+S is pressed
ipcRenderer.on('nextYear',(event, arg) => {
    setYear(currentCalendarYear + 1)
});

function createPage() {
    //Create summernote instance that autofocuses and uses the minimal ui
    $('#summernote').summernote({
        airMode: true,
        focus: true
    });



    $('#yearSelectPrevious').on('click', function() {setYear(currentCalendarYear - 1)});
    $('#yearSelectNext').on('click', function() {setYear(currentCalendarYear + 1)});

    var date = new Date();
    setYear(date.getFullYear());

    onOpen();
}

function buildCalendar() {

    //Manually build the calendar
    dates.push(createArray(31)); //January
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

//loads entry
function loadOtherDate(m, d, y) {
 
    if(dates[m][d]) {
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
                $("#" + dateString).css("background-color", filledColor);
                dates[m][d] = true;

                if(currentDateString == dateString) {
                    $("#" + dateString).css("background-color", highLightedColor);
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
    saveFile(currentDateString);
})

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
