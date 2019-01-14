//API description: https://developer.edamam.com/edamam-docs-recipe-api

module.exports = Object.freeze({
    APP_KEY: '0d12679d81b972f4f143f006ef3e2217',
    APP_ID: 'c0991d62',

    API_PATH: 'api.edamam.com',

    YES:'yes',
    NO: 'no',

    INGREDIENTS : 'ingr',
    DIET : 'diet',
    HEALTH : 'health',
    CALORIES : 'calories',
    TIME : 'time',
    EXCLUDED : 'excluded',
    
    //health
    VEGETARIAN: 'vegetarian',
    VEGAN: 'vegan',
    ALCHOHOL_FREE: 'alcohol-free',
    NUTS_FREE: 'tree-nut-free',
    SUGAR_LESS: 'sugar-conscious',
    PEANUTS_FREE: 'peanut-free',

    //progress
    FEEL_LUCKY: 'lucky',
    RESET: 'reset',
    QUESTION_NR : 'question_nr',
    QUESTION_TOTAL: 7,
    QUESTIONS: ['Are you vegetarian?','Are you vegan?','Do you drink alchohol?', 'Are you alergic to nuts?','Do you prefer food with less sugar?','Are you alergic to peanuts?','Do you feel lucky?','Are there some ingredients you do not eat?']
});