var power = true;
var tabUrl = null;

chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
}, function(tabs) {
    tabUrl = tabs[0].url;
    // Do something with tab
});
document.addEventListener("DOMContentLoaded", function() {
	getValues();
	addPowerListener2();
	addRedditListener();
	addInputListener();
});

function getValues()
{
	//Load the value of the power button
	chrome.storage.local.get({disabledSites: {}}, function(items) {
		var powerButton = document.getElementById("powerButton");
		if(items.disabledSites[tabUrl]){
			power = false;
			powerButton.style.color = "gray";
		}else{
			power = true;
		}
	});
	
	//Load the value of the skipFirst
	chrome.storage.local.get({skipFirst: 0}, function(items) {
		var skipFirstInput = document.getElementById("skipFirst");
		skipFirstInput.value = items.skipFirst;
	});
	
	//Load the value of the skipLast
	chrome.storage.local.get({skipLast: 0}, function(items) {
		var skipLastInput = document.getElementById("skipLast");
		skipLastInput.value = items.skipLast;
	});
	
	//Load the value of the skin
	chrome.storage.local.get({dataSkin: "dark"}, function(items) {
		var skinSelect = document.getElementById("skinSelect");
		skinSelect.value = items.dataSkin;
	});
	
	//Load the value of the skipButtonsEnabled
	chrome.storage.local.get({skipButtonsEnabled: true}, function(items) {
		var skipCheckbox = document.getElementById("skipButtonsEnabled");
		skipCheckbox.checked = items.skipButtonsEnabled;
	});
}

function addPowerListener()
{
	var powerButton = document.getElementById('powerButton');
	powerButton.addEventListener("click", function()
	{
		displayRefreshNotification();
		if(power)
		{
			powerButton.style.color = "gray";
			power = false;
			//chrome.storage.local.set({'enabled': false}, null);
			chrome.storage.local.set({'listOperation': 1}, null);
		}
		else
		{
			powerButton.style.color = "#0ff000";
			power = true;
			//chrome.storage.local.set({'enabled': true}, null);
			chrome.storage.local.set({'listOperation': -1}, null);
		}
	});
}

function addPowerListener2()
{
	var powerButton = document.getElementById('powerButton');
	powerButton.addEventListener("click", function()
	{
		chrome.storage.local.get({disabledSites: {}}, function(items){		
			displayRefreshNotification();
			if(power)
			{
				powerButton.style.color = "gray";
				power = false;
				//chrome.storage.local.set({'enabled': false}, null);
				items.disabledSites[tabUrl] = true;
				//chrome.storage.local.set({'listOperation': 1}, null);
			}
			else
			{
				powerButton.style.color = "#0ff000";
				power = true;
				//chrome.storage.local.set({'enabled': true}, null);
				if(items.disabledSites[tabUrl])
				{
					delete items.disabledSites[tabUrl];
				}
				//chrome.storage.local.set({'listOperation': -1}, null);
			}
			chrome.storage.local.set({"disabledSites": items.disabledSites}, null);
		});
	});
}

function addInputListener()
{
	var skipFirst = document.getElementById("skipFirst");
	skipFirst.addEventListener("input", function(){
		chrome.storage.local.set({'skipFirst': skipFirst.value}, null);
	});
	
	var skipLast = document.getElementById("skipLast");
	skipLast.addEventListener("input", function(){
		console.log(skipLast.value);
		chrome.storage.local.set({'skipLast': skipLast.value}, null);
	});
	
	var skinSelect = document.getElementById("skinSelect");
	skinSelect.addEventListener("input", function(){
		displayRefreshNotification();
		chrome.storage.local.set({'dataSkin': skinSelect.value}, null);
	});
	
	var skipCheckbox = document.getElementById("skipButtonsEnabled");
	skipCheckbox.addEventListener("click", function(){
		displayRefreshNotification();
		chrome.storage.local.set({'skipButtonsEnabled': skipCheckbox.checked}, null);
	});
}

function addRedditListener()
{
	var redditLink = document.getElementById('redditLink');
	redditLink.addEventListener("click", function(){
		var newURL = "http://www.reddit.com/r/KissAutoplay";
        chrome.tabs.create({ url: newURL });
	});
}

function displayRefreshNotification()
{
	var elem = document.getElementById('refreshNotification');
	elem.className = "notification";
}