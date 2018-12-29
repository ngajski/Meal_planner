'use strict';

function getApiKey() {
	return '0d12679d81b972f4f143f006ef3e2217';	
}

function getApiID() {
	return 'c0991d62';
}

function getApiPath() {
	return 'https://api.edamam.com/search';
}

function createUri(dish,uriBasic,apiID,appKey) {
	//https://api.edamam.com/search?q=chicken&app_id=c0991d62&app_key=0d12679d81b972f4f143f006ef3e2217
	var uri = '';
	uri = uriBasic + "?q=" + dish + "&"; 
	uri = uri + "app_id=" + apiID + "&";
	uri = uri + "app_key=" + appKey;
	return uri;
}

module.exports = {
    'getApiKey': getApiKey,
    'getApiID': getApiID,
    'getApiPath': getApiPath,
    'createUri': createUri
};