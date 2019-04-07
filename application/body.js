var fs = require('fs');
var ipcRenderer = require('electron').ipcRenderer;

var dates = [];
var documentsPath;
var currentDateString = "0000";
var fileExtension = ".jrnl";
var filledColor = "#93bbd6";
var highLightedColor = "#dbace2";


ipcRenderer.on('updateDocPath',(event, arg) => {
    console.log(arg);
    documentsPath = arg + "\\jrnl Entries";
    if(!fs.existsSync(documentsPath)) {
        fs.mkdirSync(documentsPath);
    }

    createPage();
});

ipcRenderer.on('saveFile',(event, arg) => {
    saveFile(currentDateString);
});


$(document).ready(function() {
   
});

function createPage() {
    $('#summernote').summernote({
        airMode: true,
        focus: true
    });

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

    createCalendar(dates);

    onOpen();
}

function createCalendar(dates) {
    var htmlText = "";
    for(var m = 0; m < dates.length; m++) {
        htmlText += "<div class = 'monthCol'>";
        for(var d = 0; d < dates[m].length; d++) {
            var month = (m < 10 ? '0' : '') + m;
            var date = (d < 10 ? '0' : '') + d;
            htmlText += "<div class='day' id='" + month + date + "'></div>";
        }
        htmlText += "</div>";
    }
    htmlText += ""
    $("#calendar").html(htmlText);

    document.getElementById("calendar").addEventListener("click",function(e) {

        for(var m = 0; m < dates.length; m++) {
            for(var d = 0; d < dates[m].length; d++) {
                var month = (m < 10 ? '0' : '') + m;
                var date = (d < 10 ? '0' : '') + d;
                if(e.target && e.target.id == month +""+ date) {
                    loadOtherDate(m, d);
                    updateCalendar();
                }
            }
        }
    });

}

function loadOtherDate(m, d) {
 

    if(dates[m][d]) {
        var month = (m < 10 ? '0' : '') + m;
        var date = (d < 10 ? '0' : '') + d;
        if((month + "" + date) == currentDateString) return;

        console.log("change file: " + month + date);
        saveFile(currentDateString);
        currentDateString = month + date;
        openFile(currentDateString);
    }
}

function getTodaysDateString() {
    var date = new Date();
    var m = (date.getMonth() < 10 ? '0' : '') + date.getMonth();
    var d = ((date.getDate() - 1) < 10 ? '0' : '') + (date.getDate() - 1);
    return m + "" + d;
}



function onOpen() {
    //check if already entry on this date
    //open if true
    //else make new one
    //update calendar

    var fileName = getTodaysDateString();

    if(fs.existsSync(documentsPath + "\\" + fileName + fileExtension)) {
        openFile(fileName);
    } else {
        saveFile(fileName);
        updateDateDisplay(fileName);
    }
    currentDateString = fileName;
    updateCalendar();

    
}

function updateCalendar() {
    for(var m = 0; m < dates.length; m++) {
        for(var d = 0; d < dates[m].length; d++) {
            var month = (m < 10 ? '0' : '') + m;
            var date = (d < 10 ? '0' : '') + d;
            var dateString = month + "" + date;
            var datePath = documentsPath + "\\" + dateString + fileExtension;

            if(fs.existsSync(datePath)) {
                $("#" + dateString).css("background-color", filledColor);
                console.log(dateString + " exists");
                dates[m][d] = true;

                if(currentDateString == dateString) {
                    $("#" + dateString).css("background-color", highLightedColor);
                }

            }
        }
    }
}

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

    fs.writeFile(fileName, content, function (err) {
        if(err){
            alert("An error ocurred creating the file "+ err.message)
        }
        
        console.log("The file has been succesfully saved at " + fileName);
    });

    ipcRenderer.send('done-saving');
}

function openFile(name) {
    
    var filepath = documentsPath + "\\" +  name + fileExtension;
    console.log("opening file " + filepath);

    fs.readFile(filepath, 'utf-8', (err, data) => {
        if(err){
            alert("An error ocurred reading the file :" + err.message);
            return;
        }

        // Change how to handle the file content
        updateDateDisplay(name);
        $("#summernote").summernote('code', data);
    });
}

function updateDateDisplay(dateString) {
    var month = parseInt(dateString.substring(0, 2)) + 1;
    var date = parseInt(dateString.substring(2, 4)) + 1;
    month = (month < 10 ? '0' : '') + month;
    date = (date < 10 ? '0' : '') + date;
    var adjustedName = month + "/" + date;
    $("#date").html(adjustedName);
}