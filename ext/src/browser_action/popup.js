var power = true;

document.addEventListener("DOMContentLoaded", function() {
	getValues();
	addPowerListener();
	addRedditListener();
	addInputListener();
});

function getValues()
{
	//Load the value of the power button
	chrome.storage.local.get({enabled: true}, function(items) {
		var powerButton = document.getElementById("powerButton");
		if(items.enabled){
			power = true;
		}else{
			power = false;
			powerButton.style.color = "gray";
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
}

function addPowerListener()
{
	var powerButton = document.getElementById('powerButton');
	powerButton.addEventListener("click", function()
	{
		if(power)
		{
			powerButton.style.color = "gray";
			power = false;
			chrome.storage.local.set({'enabled': false}, null);
		}
		else
		{
			powerButton.style.color = "#0ff000";
			power = true;
			chrome.storage.local.set({'enabled': true}, null);
		}
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
		chrome.storage.local.set({'dataSkin': skinSelect.value}, null);
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