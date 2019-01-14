/* eslint-disable  func-names */
/* eslint-disable  no-console */


const Alexa = require('ask-sdk');
const Utils = require('./utilities');
const Math = require('mathjs')

var C = require('./constants');

const listStatuses = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    var question = '';
    const attributesManager = handlerInput.attributesManager;

    const attributes = await attributesManager.getPersistentAttributes() || {};
    console.log(attributes);
    if (Object.keys(attributes).length === 0 || attributes[C.RESET] == C.YES) {
      var welcomeMsg = 'Hi, welcome to the Meal planner. All you recepies will be visible in the Alexa app. ';
      welcomeMsg += 'Before we start, I have to ask you a few questions. ';

      question = C.QUESTIONS[0];

      attributes[C.QUESTION_NR] = 0;
      attributes[C.RESET] = C.NO;
      attributesManager.setSessionAttributes(attributes);

      return handlerInput.responseBuilder
        .speak(welcomeMsg + question)
        .reprompt(question)
        .getResponse();

    } else if (attributes[C.QUESTION_NR] < C.QUESTION_TOTAL) {
      attributesManager.setSessionAttributes(attributes);
      var question_nr = attributes[C.QUESTION_NR];
      question = C.QUESTIONS[question_nr];

      return handlerInput.responseBuilder
        .speak('Just few questions to go. ' + question)
        .reprompt(question)
        .getResponse();
    } else {
      attributesManager.setSessionAttributes(attributes);

      question = 'Please tell me what do you want to eat?'
      var question2 = 'Do you want to eat something?'
      return handlerInput.responseBuilder
        .speak(question)
        .reprompt(question2)
        .getResponse();
    }
  },
};

const YesNoIntentHandler = {
  canHandle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const question_nr = sessionAttributes[C.QUESTION_NR];

    return (question_nr <= C.QUESTION_TOTAL) && handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent');
  },
  async handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    var answer = '';
    if (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent') answer = C.YES;
    else answer = C.NO;

    var question = '';
    var question_nr = sessionAttributes[C.QUESTION_NR]
    if (question_nr == "0") {
      sessionAttributes[C.VEGETARIAN] = answer;
      question = C.QUESTIONS[1];
    } else if (question_nr == "1") {
      sessionAttributes[C.VEGAN] = answer;
      question = C.QUESTIONS[2];
    } else if (question_nr == "2") {
      if (answer == C.YES) { sessionAttributes[C.ALCHOHOL_FREE] = C.NO; }
      else { sessionAttributes[C.ALCHOHOL_FREE] = C.YES; }
      question = C.QUESTIONS[3];
    } else if (question_nr == "3") {
      sessionAttributes[C.NUTS_FREE] = answer;
      question = C.QUESTIONS[4];
    } else if (question_nr == "4") {
      sessionAttributes[C.SUGAR_LESS] = answer;
      question = C.QUESTIONS[5];
    } else if (question_nr == "5") {
      sessionAttributes[C.PEANUTS_FREE] = answer;
      question = C.QUESTIONS[6];
    } else if (question_nr == "6") {
      sessionAttributes[C.FEEL_LUCKY] = answer;
      question = C.QUESTIONS[7];
    } else if (question_nr == "7") {
        if (answer == C.NO) question = 'What do you want to eat?';
        else question = 'What do you not like?'; 
    }

    sessionAttributes[C.QUESTION_NR] += 1;

    attributesManager.setPersistentAttributes(sessionAttributes);
    await attributesManager.savePersistentAttributes();

    return handlerInput.responseBuilder
      .speak(question)
      .reprompt(question)
      .getResponse();
  },
};

const DontEatIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AvoidIngredientIntent';
  },
  async handle(handlerInput) {
    var ingredient = handlerInput.requestEnvelope.request.intent.slots.ingredient.value;
    const attributesManager = handlerInput.attributesManager;
    const sessionAttr = attributesManager.getSessionAttributes();

    var ingredients = ingredient.split('and');
    sessionAttr[C.EXCLUDED] = ingredients;

    attributesManager.setPersistentAttributes(sessionAttr);
    await attributesManager.savePersistentAttributes();

    console.log(ingredients);
    const question = 'Ok. I am ready. What do you want to eat?'

    return handlerInput.responseBuilder
      .speak(question)
      .reprompt(question)
      .getResponse()
  }
};

const AddDishIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AddDishIntent';
  },
  async handle(handlerInput) {
    var dish = handlerInput.requestEnvelope.request.intent.slots.dish.value;

    const attributesManager = handlerInput.attributesManager;
    const sessionAttr = attributesManager.getSessionAttributes();

    var appID = C.APP_ID;
    var appKey = C.APP_KEY;

    var searchQuery = Utils.createApiQuery(dish, appID, appKey, sessionAttr);
    console.log('DishUri: ' + searchQuery);

    const response = await Utils.httpGet(C.API_PATH,searchQuery);
    var recipes = response.hits;
    const noOfRecipes = recipes.length;
    var index = 0;

    console.log('number of: ' + noOfRecipes);
    if (sessionAttr[C.FEEL_LUCKY] == C.YES) index =  Math.floor(Math.random(0,noOfRecipes));
    console.log('index = ' + index);

    var ingredientes = Utils.getIngredients(recipes[index]); 
    var recipeLabel = Utils.getLabel(recipes[index]);
    var recipeUrl = Utils.getUrl(recipes[index]);
    
    for (let i = 0; i < ingredientes.length; i++) {
      try {
        addToList(handlerInput, ingredientes[i],recipeLabel);
      } catch (e) {
        console.log('Didnt add: ' + ingredientes[i] + ' ' + e);
      }
    }

    console.log(recipeUrl);

    return handlerInput.responseBuilder
      .speak(recipeLabel + " added to the shopping list.")
      .withSimpleCard(recipeLabel, recipeUrl)
      .getResponse();

  },
};

const ResetPreferencesIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'ResetPreferencesIntent';
  },
  async handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    
    var sessionAtt = await attributesManager.getSessionAttributes();
    sessionAtt[C.RESET] = C.YES;

    attributesManager.setPersistentAttributes(sessionAtt);
    await attributesManager.savePersistentAttributes();

    return handlerInput.responseBuilder
      .speak('Preferences reset. Launch the app to set them again.')
      .getResponse();

  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can i want to eat or top to do';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  async handle(handlerInput) {
    const speechText = 'Goodbye!';

    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();
    console.log(sessionAttributes);
    attributesManager.setPersistentAttributes(sessionAttributes);
    await attributesManager.savePersistentAttributes();
    console.log('saved');

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse()
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error handled: ${error}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

// helpers
async function getListId(handlerInput, listEndsWith) {
  // check session attributes to see if it has already been fetched
  const attributesManager = handlerInput.attributesManager;
  const sessionAttributes = attributesManager.getSessionAttributes();
  let listId;

  if (!sessionAttributes.todoListId) {
    // lookup the id for the 'to do' list
    const listClient = handlerInput.serviceClientFactory.getListManagementServiceClient();
    const listOfLists = await listClient.getListsMetadata();
    if (!listOfLists) {
      console.log('permissions are not defined');
      return null;
    }
    for (let i = 0; i < listOfLists.lists.length; i += 1) {
      console.log(`found ${listOfLists.lists[i].name} with id ${listOfLists.lists[i].listId}`);
      const decodedListId = Buffer.from(listOfLists.lists[i].listId, 'base64').toString('utf8');
      console.log(`decoded listId: ${decodedListId}`);
      //  <Internal_identifier>-TASK for the to-do list
      //  <Internal_identifier>-SHOPPING_ITEM for the shopping list
      if (decodedListId.endsWith(listEndsWith)) {
        // since we're looking for the default to do list, it's always present and always active
        listId = listOfLists.lists[i].listId;
        break;
      }
    }
  }
  attributesManager.setSessionAttributes(sessionAttributes);
  console.log(JSON.stringify(handlerInput));
  return listId; // sessionAttributes.todoListId;
}

async function addToList(handlerInput, item, label) {
  console.log("addToList: starting");

  const listClient = handlerInput.serviceClientFactory.getListManagementServiceClient();
  const listId = await getListId(handlerInput, 'ITEM');
  const list = await listClient.getList(listId, listStatuses.ACTIVE);

  if (!list) {
    console.log("addToList: List doesn't exist!");
    return null;
  } 

  item += ' (' + label + ')';
  //console.log("Trying to add: " + item);
  const updateRequest = {
    value: item,
    status: listStatuses.ACTIVE,
  };

  listClient.createListItem(listId, updateRequest);
}

//exports
//.custom()
const skillBuilder = Alexa.SkillBuilders.standard();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    AddDishIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    DontEatIntentHandler,
    YesNoIntentHandler,
    ResetPreferencesIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withTableName('FoodPreferences')
  .withAutoCreateTable(true)
  .lambda();