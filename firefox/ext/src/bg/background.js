
/*// When the extension is installed or upgraded ...
	chrome.runtime.onInstalled.addListener(function() {
	// Replace all rules ...
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		// With a new rule ...
		chrome.declarativeContent.onPageChanged.addRules([
		{
			conditions: [
				new chrome.declarativeContent.PageStateMatcher({
				pageUrl: { urlMatches: 'http://kissanime.to/Anime/*' }
			}),
				new chrome.declarativeContent.PageStateMatcher({
				pageUrl: { urlMatches: 'http://kisscartoon.me/Cartoon/*' }
			})
			],
				// And shows the extension's page action.
				actions: [ new chrome.declarativeContent.ShowPageAction() ]
		}
		]);
	});
});*/

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	regKA = /http:\/\/kissanime.to\/Anime\/(.*)/g;
	regKC = /http:\/\/kisscartoon.me\/Cartoon\/(.*)/g
	var matchesKA = regKA.exec(tab.url);
	var matchesKC = regKC.exec(tab.url);
	if(matchesKA && !matchesKA[1].includes("/"))
	{
		chrome.pageAction.show(tab.id);
	}
	else if(matchesKC && !matchesKC[1].includes("/"))
	{
		chrome.pageAction.show(tab.id);
	}
});

chrome.runtime.onMessage.addListener(function(request, sender)
{
	console.log("hello, hello");
	console.log(request.url);
	if(request.url)
	{
		chrome.history.addUrl({url:request.url});
	}
});
