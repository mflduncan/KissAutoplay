/*
	To do:
		- remember volume settings
		- change video quality button
		- custom error page
		
		
	Possible updates:
		
		
		
	Decided against:
		- auto fullscreen option because offers little utility and inconsitent with almost any video player ever
		- retry on error because by the time 2 finish the user would be waiting too long anyways. going with custom error messages instead
		- text overlay to relay messages (cant load, episode name, etc) because it doesn't look good
		- myanimelist reccomendations because felt too unrelated to overall goal
		- different times for different shows because would overcomplicate
			*possibly a this show/global tab in the menu?
		
	Done:
		- episode title
		- remove getPlayer so many times - global player
		- disable next/skip when not relevant
		- if episode ends before next episode is loaded, go to the loading screen
			*rewrite video handlers to include callbacks
		- loading screen while video loads
		- skip instantly-- don't wait
		- dont run on pages other than episode list 
		- fix network error (I think done)
		- add other kiss websites 
		- separate load and play video(could be redone though)
		- make pageaction 
		- skip first run on first video
*/
var player = null;

var nextLink = null;
var prevLink = null;
var vidSource = null;
var episodeTitle = "Loading..";

var PlayerState = {
	LOADING: 0,
	BGLOADING: 1,
	LOADED: 2,
	CHANGING: 3,
	PLAYING: 4,
	INTERRUPT: 5
}
var playerState = PlayerState.CHANGING;

chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "interactive" || document.readyState === "complete") {
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


/**************************************
			Page Setup
**************************************/
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
		
	//<a>
	var btn = document.createElement("a");
	btn.style.display = 'none';
	btn.setAttribute( "id", "launch_video");
	btn.setAttribute( "href", "#lightbox_video");
	btn.setAttribute( "class", "afterglow" );
	
	//Add to document
	document.body.appendChild(vid);
	document.body.appendChild(btn);
}

function createTitle()
{
	var title = document.createElement("div");
	title.textContent = "Loading...";
	title.classList.add("ka-episode-title");
	title.id = "kaEpisodeTitle";
	
	var lightbox = document.getElementsByClassName("afterglow-lightbox-wrapper")[0];
	lightbox.appendChild(title);
}

function setTitle(newTitle)
{
	var title = document.getElementById("kaEpisodeTitle");
	title.textContent = newTitle;
}

// Description: Overrides the behavior of the links to episodes
function addEpisodeHandlers()
{
	var rows = document.getElementsByTagName("tr"); //get all rows of the table
	
	for(i = 2; i < rows.length; i++) //add the onclick to each link so that it launches the video instead of going to page
	{
		if(rows[i].cells && rows[i].cells[0])
		{
			rows[i].cells[0].childNodes[1].setAttribute( "onclick", "return false;" ); //so it doesn't navigate to the href
			rows[i].cells[0].childNodes[1].addEventListener( "click", clickVideoHandler); //so it is sent to launch video after click
		}
	}	
}

// Description: Called when an episode link is clicked. Launches lightbox video, adds video  and loads video
function clickVideoHandler()
{
	playerState = PlayerState.CHANGING;
	document.getElementById('launch_video').click();
	addVideoHandler(function(){ //run this code while it waits to get video source
		elem = player.el_;
		player.play(); //get rid of big play button
		elem.classList.add('vjs-seeking'); //show loading circle	
		createTitle();
		//player.requestFullscreen(); //auto fullscreen. possible option?
	});
	loadVideo(this.href, function(){
		changeSource(vidSource);
	}); //load the video of the link clicked on
}


/**************************************
			Player Setup
**************************************/

// Description: Adds the handler so the player knows when to switch to the next video
function addVideoHandler(callback)
{
	var counter = 0;
	
	var interval = setInterval(function(){
		player = afterglow.getPlayer("lightbox_video");
		if(player) //If the player exists, add an event handler to it
		{
			clearInterval(interval); //Stop looping
			
			chrome.storage.local.get({skipButtonsEnabled: true}, function(i) {
							if(i.skipButtonsEnabled == false)
							{
								hideSkipButtons();
							}
			});
			player.el_.focus();
			player.on('timeupdate', playerTimeHandler);

			/*player.on("error", function()
			{
				
			});*/
			if(callback != null) //call back if one is provided
			{
				callback()
			}
		}
		else if(counter++ > 50) //If we have tried for 5 seconds, then just give up already.
		{
			//console.log("could not add handlers for video");
			clearInterval(interval);
		}
	}, 100); //run every tenth second
}

function playerTimeHandler()
{
	var duration = this.duration();
	var currTime = this.currentTime();
	chrome.storage.local.get({skipLast: 0}, function(items) {
		if(duration > 0 && duration - currTime - 30 <= items.skipLast && nextLink != null) //Close to end of current video
		{
			if(playerState == PlayerState.PLAYING) //if it is not loading, start the load
			{
				playerState = PlayerState.BGLOADING;
				loadVideo(nextLink, function(){
					if(playerState == PlayerState.BGLOADING) //If it is loaded in the background while video still playing
					{
						playerState = PlayerState.LOADED; // then wait to change it
					}
					else if(playerState == PlayerState.LOADING)
					{
						playerState = PlayerState.CHANGING;
						changeSource(vidSource);
					}
				});
			}
			else if(playerState == PlayerState.LOADED && duration - currTime <= items.skipLast) //if it is loaded and at the end
			{
				playerState = PlayerState.CHANGING;
				changeSource(vidSource);
			}
			else if(playerState == PlayerState.BGLOADING && duration - currTime <= items.skipLast) //if it is not loaded and at the end
			{
				playerState = PlayerState.LOADING;
				unloadVideo();
			}
		}
		else if(playerState == PlayerState.CHANGING && duration - currTime > items.skipLast) //Start of next video
		{
			chrome.storage.local.get({skipFirst: 0}, function(i) {
				player.currentTime(i.skipFirst);
				playerState = PlayerState.PLAYING;
			});
			updateSkipButtons();
			setTitle(episodeTitle);
		}
	});
}

// Description: Adds handlers for the skip and previous buttons in the video
function addSkipHandlers()
{
	document.addEventListener("ka-playNext", function() { 
		if(nextLink != null)
		{
			if(playerState == PlayerState.PLAYING) //If the video is playing, go to the load spinner screen and load the video
			{
				playerState = PlayerState.LOADING;
				unloadVideo();
				loadVideo(nextLink, function(){
					changeSource(vidSource);
					playerState = PlayerState.CHANGING;
				});
			}
			else if(playerState == PlayerState.BGLOADING) //If the video is already loading in the background, just show the loading screen
			{
				playerState = PlayerState.LOADING;
				unloadVideo();
			}
			else if(playerState == PlayerState.LOADED) //If the video is already loaded, just change the video
			{
				changeSource(vidSource);
				playerState = PlayerState.CHANGING;
			}
			//Otherwise do nothing since the video is either loading or changing
		}
	});	

	document.addEventListener("ka-playPrev", function() { 
		if(prevLink != null)
		{
			if(playerState != PlayerState.INTERRUPT) //Interrupt any loading, changing, etc.
			{
				playerState = PlayerState.INTERRUPT;
				unloadVideo();
				loadVideo(prevLink, function(){
					console.log(player.currentSrc());
					console.log(vidSource);
					if(player.currentSrc() == vidSource) //If it already loaded the video ahead
					{
						loadVideo(prevLink, function() //you have to do it twice :(
						{
							changeSource(vidSource);
							playerState = PlayerState.CHANGING;
						});
					}
					else //Otherwise you are good
					{
						changeSource(vidSource);
						playerState = PlayerState.CHANGING;
					}
				});
			}
		}
	});		
}

//Description: Greys out the skip button if the 
function updateSkipButtons()
{
	var nextButton= player.controlBar.NextVideoButton;
	var prevButton= player.controlBar.PrevVideoButton;
	//Next button
	if(nextLink == null)
	{
		nextButton.disable();
		console.log("disabled");
	}
	else
	{
		nextButton.enable();
	}
	//Prev button
	if(prevLink == null)
	{
		prevButton.disable();
	}
	else
	{
		prevButton.enable();
	}
}

// Description: Hides the skip and previous buttons
function hideSkipButtons()
{
	player.controlBar.NextVideoButton.el_.classList.add("vjs-hidden");
	player.controlBar.PrevVideoButton.el_.classList.add("vjs-hidden");
}
// Description: loads the next video into the player
// Preconditions: video player must already be open!


/**************************************
			Data fetching
**************************************/

// Description: Grabs the source of the next episode and calls callback
function loadVideo(url, callback)
{
	var i = createIFrame(url);
	var count = 0;
	var interval = setInterval(function()
	{ 
		if(i.contentWindow &&i.contentWindow.document && i.contentWindow.document.getElementById("my_video_1_html5_api") && i.contentWindow.document.getElementById("my_video_1_html5_api").src && i.contentWindow.document.getElementById("my_video_1_html5_api").src != "")
		{
			getVideoFromFrame(i);
			clearInterval(interval);
			if(callback != null)
			{
				callback();
			}
		}
		/*if(i.src && i.src.includes("AreYouHuman") //if you are spamming too much
		{
			
		}*/
	}, 50);
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
	player.el_.focus();
	vidSource = vid.src;
	vid.removeAttribute("src");
	//vid.load(); //reload with no source so it doesn't keep buffering
	vid.parentElement.removeChild(vid);
	//set title
	episodeTitle = trimTitle(i.contentWindow.document.title);
	//set nextLink
	var nxt = i.contentWindow.document.getElementById('btnNext');
	if(nxt)
	{
		nextLink = nxt.parentElement.href;
	}
	else
	{
		nextLink = null;
	}
	//set prevLink
	var prev = i.contentWindow.document.getElementById('btnPrevious');
	if(prev)
	{
		prevLink = prev.parentElement.href;
	}
	else
	{
		prevLink = null;
	}
}

//Description: Gets just the episode name from a page title
function trimTitle(title)
{
	var newTitle = title.slice(0, title.indexOf(" - "));
	return newTitle;
}


/**************************************
			Video Changing
**************************************/

//Description: loads the source into the player and beings playing
function changeSource(src)
{
	elem.classList.remove('vjs-seeking'); //in case we were on a loading screen (will come back if actualy loading still needs to be done)
	player.src(src);
}

// Description: Stops the video. Displays black with a loading circle. 
function unloadVideo()
{
	elem = player.el_;
	vid = player.el_.children[0];
	
	player.pause();
	vid.removeAttribute("src");
	player.load();
	player.play();
	elem.classList.add('vjs-seeking'); //show loading circle
}