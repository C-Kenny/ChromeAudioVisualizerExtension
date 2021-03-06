var s = s || {};
s.widthInHalf = 0.0;
s.heightInHalf = 0.0;

s.rotationOffset = Math.PI/4.0;
s.clrOffset = 0.0;
var AudioScenes = AudioScenes || {},

getFrequency=function(from, to)
{
	var total = 0;
	if(!g.byteFrequency)
		return 0;
	var i;
	for (i = Math.round(from); i < Math.round(to); i++)
		total += g.byteFrequency[i];
	return total||0;
},
getLow=function(){
	var third = g.frequencyBinCount/3;
	return getFrequency(0,third);
},
getMid=function(){
	var third = g.frequencyBinCount/3;
	return getFrequency(third, third*2);
},
getHigh=function(){
	var third = g.frequencyBinCount/3;
	return getFrequency(third*2, g.frequencyBinCount-1)*10;
};
function getVolume(){
	return getFrequency(0, g.frequencyBinCount/16);
};
function resetBrokenGlobalSceneValues()
{
	s.widthInHalf=defaultIfBroken(s.widthInHalf, 0.0);
	s.heightInHalf=defaultIfBroken(s.heightInHalf, 0.0);
	s.rotationOffset=defaultIfBroken(s.rotationOffset, Math.PI/4.0);
	s.clrOffset=defaultIfBroken(s.clrOffset, 0.0);
}
function defaultIfBroken(num, defaultValue)
{
	if(num != null && !isNaN(num))
		return num;
	return defaultValue;
}
function parseSettings(scene, settings, preset)
{
	scene.settings = new settings();
	if(preset === "default")
	{
		scene.name = scene.originalName;
		return;
	}
	for(var preSetSetting in preset)
		scene.settings[preSetSetting] = preset[preSetSetting];
}

var SceneSelector = function()
{
	this.sceneNames = [];
	this.actualScenes = [];
	this.scene = null;
};
SceneSelector.prototype.setRandomScene = function()
{
	if(OV.startupScene in this.sceneNames)
		this.scene = OV.startupScene;
	else{
		var i = Math.round(Math.random()*(this.sceneNames.length-1));
		this.scene = this.sceneNames[i];
	}
};
SceneSelector.prototype.setScene = function(name)
{
	this.scene = name;
};
SceneSelector.prototype.insertPresets = function(savedPresets)
{
	var oldList = this.sceneNames;
	this.sceneNames = this.actualScenes.slice();
	var retVal;
	for(var preset in savedPresets)
	{
		var presetName = preset.split(AV.strDelim)[1];
		aLog("inserting presetScene: "+presetName,1);
		this.sceneNames.push(presetName);
		if(oldList.indexOf(presetName) === -1)
			retVal = this.sceneNames[this.sceneNames.length-1]
	}
	this.sceneNames = this.sceneNames.sort();
	if(g.gui)
		g.gui.repopulateSceneList();
	return retVal;
};
SceneSelector.prototype.insertActualScene = function(scene)
{
	this.sceneNames.push(scene);
	this.actualScenes.push(scene);
}

function spin(i, data)
{
	var max = g.frequencyBinCount-1;
	if(i>max)
		i=0+(i-max);
    while(i > max)
		i -= max+1;
    while(i < 0)
		i += max+1;
	var idx = clamp(i, 0, max);
	return data[idx] ? data[idx] : 0;
};

function indexSpinner(i, velocity)
{
	i+=velocity;
	var max = g.frequencyBinCount-1;
	while(i>max)
		i -= max+1;
	while(i<0)
		i += max+1;
	return clamp(i, 0, max);
}
function clamp(x, min, max)
{
	return Math.max(Math.min(x, max), min);
}
