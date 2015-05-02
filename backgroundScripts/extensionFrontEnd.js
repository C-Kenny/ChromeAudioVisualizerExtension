
// ExtensionFrontEnd -- begin
var ExtensionFrontEnd = function()
{
	this.injectedTabs = {};
};
ExtensionFrontEnd.prototype.togglePauseTab = function(tabId)
{
	if(tabId in this.injectedTabs && this.injectedTabs[tabId].injected==true)
	{
		console.log("toggling pause on tabid: "+tabId);
		chrome.tabs.executeScript(tabId, { code: "togglePause();" });
	}
	else
		console.log("trying to toggle pause on uninjected tab with id: "+tabId);
};
ExtensionFrontEnd.prototype.MainClickedCallback = function(tab)
{
	console.log("MainKey triggered on tabid: "+tab.id);
    chrome.tabs.executeScript(tab.id,
		{code: "chrome.extension.sendMessage({ loaded: typeof g !== 'undefined'});"},
		function()
		{
			if(!(tab.id in this.injectedTabs))
				this.injectedTabs[tab.id] = new TabInfo();
			if(this.injectedTabs[tab.id].injected==false)
			{
				var scriptInjector = new ScriptInjector(tab.id);
				scriptInjector.injectScripts([
					"lib/dat.gui.js",
					"lib/stats.min.js",
					"contentScripts/tools.js",
					"contentScripts/scenes/scenes.js",
					"contentScripts/scenes/circleScene.js",
					"contentScripts/scenes/wormScene.js",
					"contentScripts/scenes/wartScene.js",
					"contentScripts/sceneManager.js",
					"contentScripts/init.js"
				],
					function()
					{
						this.injectedTabs[tab.id].injected = true;
						chrome.tabCapture.capture({audio: true},
							function(stream)
							{
								this.initTab(stream, tab.id);
							}.bind(this)
						);
					}.bind(this)
				);
			}
			else
				this.togglePauseTab(tab.id);
		}.bind(this)
	);
};
ExtensionFrontEnd.prototype.initTab = function(stream, tabId)
{
	if(!stream)
		console.log(chrome.extension.lastError.message);
	else
		this.initAudio(stream, tabId);
	this.connectToTab(tabId);
	chrome.tabs.executeScript(tabId, { code: "init();" });
}
ExtensionFrontEnd.prototype.messageHandler = function(req, sender, sendResponse)
{
    if ("tab" in sender)
	{
		if(!(sender.tab.id in this.injectedTabs))
			this.injectedTabs[sender.tab.id] = new TabInfo();
		if(req.loaded === false)
			this.injectedTabs[sender.tab.id].injected=false;
		else
			this.injectedTabs[sender.tab.id].injected=true;
		console.log("tab with id: "+sender.tab.id+" injected status: "+
			this.injectedTabs[sender.tab.id].injected);
	}
};
ExtensionFrontEnd.prototype.updateHandler = function(tabId, changeinfo, tab)
{
    chrome.tabs.executeScript(tabId, {
        code: "chrome.extension.sendMessage({ loaded: typeof g !== 'undefined'});"
	});
};
ExtensionFrontEnd.prototype.onPortMessage = function(msg, port)
{
	var byteFrequency = new Uint8Array(512);
	this.injectedTabs[port.name].analyzer.getByteFrequencyData(byteFrequency);
	this.injectedTabs[port.name].port.postMessage(byteFrequency);
};
ExtensionFrontEnd.prototype.initAudio = function(stream, id)
{
	var context = new AudioContext();
	var sourceNode = context.createMediaStreamSource(stream);
	this.injectedTabs[id].analyzer = context.createAnalyser();
	this.injectedTabs[id].analyzer.fftSize = 512;
	sourceNode.connect(this.injectedTabs[id].analyzer);
	sourceNode.connect(context.destination);
}
ExtensionFrontEnd.prototype.connectToTab = function(id)
{
	console.log("connecting 2 tab: " + id);
	this.injectedTabs[id].port = chrome.tabs.connect(id);
	this.injectedTabs[id].port.name = id;
	this.injectedTabs[id].port.onMessage.addListener(this.onPortMessage.bind(this));
}
// ExtensionFrontEnd -- end


// ScriptInjector  -- begin
var ScriptInjector = function(tabId)
{
	this.tabId = tabId;
	this.scriptsLoadedCallback = null;
}
ScriptInjector.prototype.injectScripts = function(scripts, callback)
{
	this.scriptsLoadedCallback = callback;
	this.scripts = scripts;
	this.scriptsLoaded = 0;
	for(var script of scripts)
		chrome.tabs.executeScript(this.tabId, {file:script}, this.scriptInjectCount.bind(this));
}
ScriptInjector.prototype.scriptInjectCount=function()
{
	if(++this.scriptsLoaded == this.scripts.length)
	{
		this.scriptsLoadedCallback();
	}
}
// ScriptInjector  -- end

// TabInfo - date struct class
var TabInfo = function()
{
	this.port = null;
	this.id = null;
	this.injected = false;
	this.analyzer = null;
};