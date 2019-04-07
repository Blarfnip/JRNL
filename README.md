# JRNL
#### A Simple Journaling Software for Keeping Track of Daily Thoughts

Inspired by [@dittomat's](https://twitter.com/dittomat) journaling app which took inspiration from
[@SimoneGiertz's](https://twitter.com/simonegiertz?lang=en) amazing calendar, this is my spin on the idea. The original prototype was built
in a week with the goal of having a very simple way of consolidating my daily thoughts.   
  
![Early Gif](/Ver1.gif)  

All jrnl entries are saved in `/Documents/jrnl Entries` as `.jrnl` files. These files are markdown files that can be opened and read
in any other markdown editor.  
  
jrnl tries its hardest to save your entries as much as it can. It will save automatically when you switch to viewing another entry 
and when you quit (by pressing `Esc`). But if that isn't enough for you, `Ctrl/Cmd+S` will manually save the entry as well.  
  
Upon opening jrnl it will automatically open up the day's entry. If an entry does not exist it will make one.  
  
#### Renaming `.jrnl` files will cause jrnl to lose track of them

## Installing
### For Personal Use  
Download the latest version from the [**releases**](https://github.com/Blarfnip/JRNL/releases/stable) tab in this repo and run the executable.

### For Development
This project is built with Node.js and Electron. To develop for this have Node.js installed and do the following:
1. Clone the repo  
2. navigate to **application** folder in a terminal  
3. run `npm install`  
4. run `npm start` to open application  

#### To build an executable
Use `npm run package-win32` to use `electron packager` to automatically build the electron app into a Win32 executable.  

## Like what I do?
[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/T6T1TDCS)
