/*
	To do:
		- comment and clean code
		- retry on error
		
	Possible updates:
		- loading screen while video loads
		- change video quality button
		- text overlay to relay messages (cant load, episode name, etc)
		- different times for different shows
		- myanimelist reccomendations
		- skip instantly-- don't wait
		
	Done:
		- dont run on pages other than episode list 
		- fix network error (I think done)
		- add other kiss websites 
		- separate load and play video(could be redone though)
		- make pageaction 
		- skip first run on first video
*/

var nextLink = null;
var vidSource = null;
var changing = false;
var nextVideoLoaded = false;
var nextVideoLoading = false;

chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "interactive") {
		clearInterval(readyStateCheckInterval);

		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		console.log("KissAutoplay check started");
		// ----------------------------------------------------------
		
		//load user setting to see if extension is off
		chrome.storage.local.get({enabled: true}, function(items) {
			if(items.enabled == false) //the extension is turned off
			{
				console.log("KissAutoplay turned off");
			}
			else //the extension is on, so inject into the page
			{
				console.log("KissAutoplay now running");
				createVideo(); //create the elements needed on the page
				addEpisodeHandlers(); //add handlers so the links don't change the page
				addSkipHandlers(); //add handlers for the skip button in player
				
				//fire the event so the Afterglow player looks for the video
				var e = document.createEvent("CustomEvent");
				e.initEvent("ka-started", true, true);
				window.document.dispatchEvent(e);
			}
		});
	}
	}, 10);
});

// Description: Creates the video and anchor elements necessary for Aferglow and adds them to the document. 
function createVideo()
{
	//<video>
	var vid = document.createElement("video");
	vid.setAttribute( "id", "lightbox_video" );
	vid.setAttribute( "width", "1280" );
	vid.setAttribute( "height", "720" );
	chrome.storage.local.get({dataSkin: "dark"}, function(i) {
			if(i.dataSkin == "dark" || i.dataSkin == "light")
			{
				vid.setAttribute( "data-skin", i.dataSkin );
			}
	});
	
	//<source>
	var src = document.createElement("source");
	src.setAttribute( "id", "video_source");
	src.setAttribute( "type", "video/mp4");
	
	//<a>
	var btn = document.createElement("a");
	btn.style.display = 'none';
	btn.setAttribute( "id", "launch_video");
	btn.setAttribute( "href", "#lightbox_video");
	btn.setAttribute( "class", "afterglow" );
	
	//Add to document
	vid.appendChild(src);
	document.body.appendChild(vid);
	document.body.appendChild(btn);
}

// Description: loads the next video into the player
// Preconditions: video player must already be open!
function playNext()
{
	//console.log("Loading next video...");
	//lightbox("<p>Loading...</p>");
	var i = createIFrame(nextLink);
	var count = 0;
	//i.onload = function() 
	var interval = setInterval(function()
	{ 
		if(i.contentWindow &&i.contentWindow.document && i.contentWindow.document.getElementById("my_video_1_html5_api") && i.contentWindow.document.getElementById("my_video_1_html5_api").src && i.contentWindow.document.getElementById("my_video_1_html5_api").src != "")
		{
			//console.log("skipping that other shit...");
			getVideoFromFrame(i);
			//i.parentNode.removeChild(i); 
			//changeSource(vidSource); //change the video in the player
			nextVideoLoaded = true;
			clearInterval(interval);
		}
	}, 50);
	//console.log("end of loadVideo");
}

// Description: opens a lightbox and plays a video inside
function loadVideo(url)
{
	//console.log("Loading next video...");
	//lightbox("<p>Loading...</p>");
	var i = createIFrame(url);
	var count = 0;
	//i.onload = function() 
	var interval = setInterval(function()
	{ 
		if(i.contentWindow &&i.contentWindow.document && i.contentWindow.document.getElementById("my_video_1_html5_api") && i.contentWindow.document.getElementById("my_video_1_html5_api").src && i.contentWindow.document.getElementById("my_video_1_html5_api").src != "")
		{
			//console.log("skipping that other shit...");
			getVideoFromFrame(i);
			i.parentNode.removeChild(i); 
			//changeSource(vidSource); //launch the video in the lightbox
			//console.log("changing source");
			//changeSource(vidSource);

			document.getElementById('video_source').src = vidSource;
			document.getElementById('launch_video').click();
			addVideoHandler();
			clearInterval(interval);
		}
	}, 50);
	//console.log("end of loadVideo");
}

// Description: opens a lightbox and plays a video inside
function loadNextVideo(url)
{
	//console.log("Loading next video...");
	//lightbox("<p>Loading...</p>");
	var i = createIFrame(url);
	var count = 0;
	//i.onload = function() 
	var interval = setInterval(function()
	{ 
		if(i.contentWindow &&i.contentWindow.document && i.contentWindow.document.getElementById("my_video_1_html5_api") && i.contentWindow.document.getElementById("my_video_1_html5_api").src && i.contentWindow.document.getElementById("my_video_1_html5_api").src != "")
		{
			//console.log("skipping that other shit...");
			getVideoFromFrame(i);
			i.parentNode.removeChild(i); 
			//changeSource(vidSource); //launch the video in the lightbox
			//console.log("changing source");
			//changeSource(vidSource);

			document.getElementById('video_source').src = vidSource;
			document.getElementById('launch_video').click();
			addVideoHandler();
			clearInterval(interval);
		}
	}, 50);
	//console.log("end of loadVideo");
}



function changeSource(src)
{
	afterglow.getPlayer("lightbox_video").src(src);
}

// Description: Overrides the behavior of the links to episodes
function addEpisodeHandlers()
{
	var rows = document.getElementsByTagName("tr"); //get all rows of the table
	
	for(i = 2; i < rows.length; i++) //add the onclick to each link so that it launches the video instead of going to page
	{
		rows[i].cells[0].childNodes[1].setAttribute( "onclick", "return false;" ); //so it doesn't navigate to the href
		rows[i].cells[0].childNodes[1].addEventListener( "click", clickVideoHandler); //so it is sent to launch video after click
	}	
}

// Description: Called when an episode link is clicked. Just loads video right now.
function clickVideoHandler()
{
	loadVideo(this.href); //load the video of the link clicked on
}

// Description: Creates the IFrame used to grab the video source
function createIFrame(url)
{
	var i = document.getElementById("hiddenDisplay");
	if(i)
	{
		i.src = url;
		return i;
	}
	else
	{
		i = document.createElement('iframe');
		i.id = 'hiddenDisplay';
		i.style.display = 'none';
		i.src = url;
		document.body.appendChild(i);	
		return i;
	}
}

// Description: Grabs the video source from the episode page 
function getVideoFromFrame(i)
{
	var vid = i.contentWindow.document.getElementById("my_video_1_html5_api");
	vid.pause();
	vidSource = vid.src;
	//console.log(vidSource);
	vid.parentElement.removeChild(vid);
	
	var nxt = i.contentWindow.document.getElementById('btnNext');
	if(nxt)
	{
		nextLink = nxt.parentElement.href;
		//console.log(nextLink);
	}
	else
	{
		nextLink = null;
	}
}

// Description: Adds the handler so the player knows when to switch to the next video
function addVideoHandler()
{
	var counter = 0;
	
	var interval = setInterval(function(){
		var player = afterglow.getPlayer("lightbox_video");
		if(player) //If the player exists, add an event handler to it
		{
			clearInterval(interval); //Stop looping
			chrome.storage.local.get({skipFirst: 0}, function(i) {
							player.currentTime(i.skipFirst);
						});
			chrome.storage.local.get({skipButtonsEnabled: true}, function(i) {
							if(i.skipButtonsEnabled == false)
							{
								hideSkipButtons();
							}
						});
						
			player.on('timeupdate', function()
			{
				var duration = this.duration();
				var currTime = this.currentTime();
				chrome.storage.local.get({skipLast: 0}, function(items) {
					if(duration > 0 && duration - currTime <= items.skipLast && !changing && nextVideoLoaded) //if at the end of the video then play the next video
					{
						changing = true;
						nextVideoLoading = false;
						nextVideoLoaded = false;
						//playNext();
						changeSource(vidSource);
						//console.log("at the end, buddy");
						//console.log(duration - currTime);
					}
					else if(duration > 0 && duration - currTime - 30 <= items.skipLast && !changing && !nextVideoLoading) //run 30 seconds early
					{
						nextVideoLoading = true;
						//console.log("loading the next one, buddy");
						playNext();
					}
					else if(changing && duration - currTime > items.skipLast) //if it is done changing, skip the first amount the user specifies
					{
						//console.log("video handlers back online");
						changing = false;
						chrome.storage.local.get({skipFirst: 0}, function(i) {
							player.currentTime(i.skipFirst);
						});
					}
				});
			});
			//console.log("added video handlers");
		}
		else if(counter++ > 20) //If we have tried for 10 seconds, then just give up already.
		{
			//console.log("could not add handlers for video");
			clearInterval(interval);
		}
	}, 500); //run every half second
}

function addSkipHandlers()
{
	document.addEventListener("ka-playNext", function() { 
		nextVideoLoaded = false;
		playNext();
		var interval = setInterval(function()
		{ 
			if(nextVideoLoaded)
			{
				clearInterval(interval);
				changeSource(vidSource);
				changing = true;
			}
		}, 500);
	});		
}

function hideSkipButtons()
{
	var player = afterglow.getPlayer("lightbox_video");
	player.controlBar.NextVideoButton.el_.classList.add("vjs-hidden");
	player.controlBar.PrevVideoButton.el_.classList.add("vjs-hidden");
}