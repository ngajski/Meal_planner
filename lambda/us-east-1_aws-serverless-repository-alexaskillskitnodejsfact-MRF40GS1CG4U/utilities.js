'use strict';

function getAppKey() {
	return '0d12679d81b972f4f143f006ef3e2217';	
}

function getAppID() {
	return 'c0991d62';
}

function getApiPath() {
	return 'https://api.edamam.com/search';
}

function createUri(dish,uriBasic,apiID,appKey) {
	//var uri = https://api.edamam.com/search?q=chicken&app_id=c0991d62&app_key=0d12679d81b972f4f143f006ef3e2217
	var uri = '';
	uri = uriBasic + "?q=" + dish + "&"; 
	uri = uri + "app_id=" + apiID + "&";
	uri = uri + "app_key=" + appKey;
	//return 'https://api.edamam.com/search?q=pizza&app_id=c0991d62&app_key=0d12679d81b972f4f143f006ef3e2217';
	return uri;
}

function getIngredients(recipe) {
    var ingredients = [];
    console.log("Recipe:" + recipe);
    for (let i = 0; i < recipe.recipe.ingredients.length; i++) {
        ingredients.push(recipe.recipe.ingredients[i].text);
    }
    return ingredients;
}

module.exports = {
    'getAppKey': getAppKey,
    'getAppID': getAppID,
    'getApiPath': getApiPath,
    'createUri': createUri,
    'getIngredients': getIngredients
};