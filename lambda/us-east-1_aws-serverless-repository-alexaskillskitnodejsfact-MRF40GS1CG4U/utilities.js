'use strict';
const https = require('https');
const C = require('./constants');

function getAppKey() {
	return '0d12679d81b972f4f143f006ef3e2217';	
}

function getAppID() {
	return 'c0991d62';
}

function getApiPath() {
	return 'https://api.edamam.com/search';
}

function createApiQuery(dish,apiID,appKey,sessionAttr) {
    //var uri = /search?q=chicken&app_id=c0991d62&app_key=0d12679d81b972f4f143f006ef3e2217

    const vege = sessionAttr[C.VEGETARIAN];
    const alchohol = sessionAttr[C.ALCHOHOL_FREE]
    const gluten = sessionAttr[C.GLUTEN_FREE];
    const lactose = sessionAttr[C.LACTOSE_FREE];
    const pork = sessionAttr[C.PORK_FREE];
    const peanuts = sessionAttr[C.PEANUTS_FREE];
    const excludedIngredients  =sessionAttr[C.EXCLUDED];

	var uri = '/search';
	uri = uri + "?q=" + dish + "&"; 
	uri = uri + "app_id=" + apiID + "&";
	uri = uri + "app_key=" + appKey;
    
    if (vege != null && vege == C.YES) uri = uri + "&" + "health=" + C.VEGETARIAN;
    if (alchohol != null && alchohol == C.YES) uri = uri + "&" + "health=" + C.ALCHOHOL_FREE;
    if (gluten != null && gluten == C.YES) uri = uri + "&" + "health=" + C.GLUTEN_FREE;
    if (lactose != null && lactose == C.YES) uri = uri + "&" + "health=" + C.LACTOSE_FREE;
    if (pork != null && pork == C.YES) uri = uri + "&" + "health=" + C.PORK_FREE;
    if (peanuts != null && peanuts == C.YES) uri = uri + "&" + "health=" + C.PEANUTS_FREE;

    if (excludedIngredients != null) {
        excludedIngredients.forEach(ingredient => {
            uri = uri + "&" + "excluded=" + ingredient;
        });
    }
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

function getLabel(recipe) {
    return recipe.recipe.label;
}

function getUrl(recipe) {
        return recipe.recipe.shareAs;
}

function httpGet(apiPath, query) {
    return new Promise(((resolve, reject) => {
      var options = {
        host: apiPath,
        port: 443,
        path: query,
        method: 'GET',
      };
  
      const request = https.request(options, (response) => {
        response.setEncoding('utf8');
        let returnData = '';
  
        response.on('data', (chunk) => {
          returnData += chunk;
        });
  
        response.on('end', () => {
          resolve(JSON.parse(returnData));
        });
  
        response.on('error', (error) => {
          reject(error);
        });
      });
      request.end();
    }));
  }


module.exports = {
    'getAppKey': getAppKey,
    'getAppID': getAppID,
    'getApiPath': getApiPath,
    'createApiQuery': createApiQuery,
    'getIngredients': getIngredients,
    'getLabel': getLabel,
    'getUrl': getUrl,
    'httpGet': httpGet
};