
// When the extension is installed or upgraded ...
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
});

chrome.extension.onMessage.addListener(function(request, sender)
{
	console.log("hello, hello");
	console.log(request.url);
	if(request.url)
	{
		chrome.history.addUrl({url:request.url});
	}
});