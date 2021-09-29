const { app, BrowserWindow } = require('electron')
function createWindow () 
{
	const win = new BrowserWindow({width: 1600, height: 900, autoHideMenuBar: true});
	win.loadFile('index.html');
}
  app.whenReady().then(() => {  createWindow()})