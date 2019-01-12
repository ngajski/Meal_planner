/* eslint-disable  func-names */
/* eslint-disable  no-console */


const Alexa = require('ask-sdk');
const Utils = require('utilities');
const Request = require('request');

//var constants = require('./constants');
const listIsEmpty = '#list_is_empty#';

const listStatuses = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const speechText = 'Say i want to eat some dish!';
    const attributesManager = handlerInput.attributesManager;

    const attributes =  await attributesManager.getPersistentAttributes() || {};
    if (Object.keys(attributes).length === 0) {
      attributes['question_nr'] = 0

      attributesManager.setSessionAttributes(attributes);

      return handlerInput.responseBuilder
        .speak('Before we start, I have to ask you a few questions. Is that OK?')
        .reprompt('Everything alright?')
        .getResponse();
    }
  },
};

const AddDishIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AddDishIntent';
  },
  async handle(handlerInput) {
    var dish = handlerInput.requestEnvelope.request.intent.slots.dish.value;
    var appID = Utils.getAppID();
    var appKey = Utils.getAppKey();
    var apiPath = Utils.getApiPath();

    var dishUri = Utils.createUri(dish, apiPath, appID, appKey);
    console.log('DishUri: ' + dishUri);

    Request(dishUri, { json: true }, (err, res, body) => {
      if (err) {
        console.log(err);
        return err;
      }
      //console.log('API req: ' + body.q);
      var recipes = body.hits;
      console.log('Recipes: ' + recipes);
      var ingredientes = Utils.getIngredients(recipes[0]);
      //console.log(ingredientes);

      for (let i = 0; i < ingredientes.length; i++) {
        try {
          addToList(handlerInput, ingredientes[i]);
          console.log('Success!');
        } catch (e) {
          console.log('Didnt add: ' + ingredientes[i] + ' ' + e);
        }
      }
    });

    // await addToList(handlerInput,dish);
    return handlerInput.responseBuilder
      .speak('Ingredients added!')
      .getResponse();

  },
};

const TopToDoHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'TopToDoIntent';
  },
  async handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;

    let speechOutput;
    console.log('Starting top todo handler');
    const itemName = await getTopToDoItem(handlerInput);
    if (!itemName) {
      speechOutput = 'Alexa List permissions are missing. You can grant permissions within the Alexa app.';
      const permissions = ['read::alexa:household:list'];
      return responseBuilder
        .speak(speechOutput)
        .withAskForPermissionsConsentCard(permissions)
        .getResponse();
    } else if (itemName === listIsEmpty) {
      speechOutput = 'Your todo list is empty.';
      return responseBuilder
        .speak(speechOutput)
        .getResponse();
    }
    speechOutput = 'Your top todo is ${itemName}.';

    return responseBuilder
      .speak('Success')
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
    attributesManager.setPersistentAttributes(sessionAttributes);
    await attributesManager.savePersistentAttributes();

    return handlerInput.responseBuilder
      .speak(speechText)
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

async function addToList(handlerInput, item) {
  console.log("addToList: starting");

  const listClient = handlerInput.serviceClientFactory.getListManagementServiceClient();
  const listId = await getListId(handlerInput, 'ITEM');
  const list = await listClient.getList(listId, listStatuses.ACTIVE);

  if (!list) {
    console.log("addToList: List doesn't exist!");
    return null;
  } else if (!list.items || list.items.length === 0) {
    console.log("addToList: List is empty!");
    return (listIsEmpty);
  }
  console.log("Trying to add: " + item);
  const updateRequest = {
    value: item,
    status: listStatuses.ACTIVE,
  };

  listClient.createListItem(listId, updateRequest);

}

async function getTopToDoItem(handlerInput) {
  const listClient = handlerInput.serviceClientFactory.getListManagementServiceClient();
  const listId = await getListId(handlerInput, 'ITEM');
  console.log(`listid: ${listId}`);
  const list = await listClient.getList(listId, listStatuses.ACTIVE);
  if (!list) {
    console.log('null list');
    return null;
  } else if (!list.items || list.items.length === 0) {
    console.log('empty list');
    return listIsEmpty;
  }
  console.log(`list item found: ${list.items[0].value} with id: ${list.items[0].id}`);
  return list.items[0].value;
}

//exports
//.custom()
const skillBuilder = Alexa.SkillBuilders.standard();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    TopToDoHandler,
    AddDishIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withTableName('FoodPreferences')
  .withAutoCreateTable(true)
  .lambda();