# JRNL

## ABANDONWARE NOTICE
_As of 2024, this project is free to use and open source._  
  
I strongly encourage forking the repo and building on top of this project.  

---

#### A Simple Journaling Software for Keeping Track of Daily Thoughts

Inspired by [@dittomat's](https://twitter.com/dittomat) journaling app which took inspiration from
[@SimoneGiertz's](https://twitter.com/simonegiertz?lang=en) amazing calendar, this is my spin on the idea. The original prototype was built
in a week with the goal of having a very simple way of consolidating my daily thoughts.   
  
![Early Gif](/Ver1.gif)  

All JRNL entries are saved in `/Documents/JRNL Entries` as `.jrnl` files. These files are markdown files that can be opened and read
in any other markdown editor.  
  
JRNL tries its hardest to save your entries as much as it can. It will save automatically when you switch to viewing another entry 
and when you quit (by pressing `Esc`). But if that isn't enough for you, `Ctrl/Cmd+S` will manually save the entry as well.  
  
Upon opening JRNL it will automatically open up the day's entry. If an entry does not exist it will make one.  
  
#### Renaming `.jrnl` files will cause JRNL to lose track of them

## Installing
Grab the application pre-compiled for windows at [itch.io](https://blarfnip.itch.io/jrnl)

### For Development
This project is built with Node.js and Electron. To compile from source, have Node.js installed and do the following:
1. Clone the repo  
2. navigate to **application** folder in a terminal `cd ./application`  
3. run `npm install`  
4. run `npm start` to open application  

#### To build an executable
Use `npm run package-win32` to use `electron packager` to automatically build the electron app into a Win32 executable.  

## Like this project?
Consider purchasing it with a donation on itch.io:  
[![Screenshot 2024-05-14 200456](https://github.com/Blarfnip/JRNL/assets/13181960/57e2a66d-da45-49e7-86b7-8e1cfbffd84c)](https://blarfnip.itch.io/jrnl)
