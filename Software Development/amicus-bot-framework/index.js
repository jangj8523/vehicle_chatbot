// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const dotenv = require('dotenv');
const path = require('path');
const restify = require('restify');

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, UserState, MemoryStorage, ConversationState } = require('botbuilder');

// Import required bot configuration.
const { BotConfiguration } = require('botframework-config');

// This bot's main dialog.
const { MyBot } = require('./bot');


//  Azure DB Storage
// const CosmosClient = require('@azure/cosmos').CosmosClient;
// const config = require('./util/config');
// const endpoint = config.endpoint;
// const masterKey = config.primaryKey;
// const client = new CosmosClient({ endpoint: endpoint, auth: { masterKey: masterKey } });
// const HttpStatusCodes = { NOTFOUND: 404 };
// const databaseId = config.database.id;
// const containerId = config.container.id;

//  async function createDatabase() {
//   const { database } = await client.databases.createIfNotExists({ id: databaseId });
//   console.log(`Created database:\n${database.id}\n`);
// }

// createDatabase()
//   .then(() => readDatabase())
//   .then(() => { exit(`Completed successfully`); })
//   .catch((error) => { exit(`Completed with error ${JSON.stringify(error) }`) });

require('dotenv').config()
// const storage = require('azure-storage');

// Read botFilePath and botFileSecret from .env file
// Note: Ensure you have a .env file and include botFilePath and botFileSecret.
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

// bot endpoint name as defined in .bot file
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const DEV_ENVIRONMENT = 'development';

// bot name as defined in .bot file
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);

// Create HTTP server
const server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open amicus.bot file in the Emulator`);
});

// .bot file path
const BOT_FILE = path.join(__dirname, (process.env.botFilePath || ''));
// console.log(__dirname)
// Read bot configuration from .bot file.
let botConfig;
try {
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.error(`\nError reading bot file. Please ensure you have valid botFilePath and botFileSecret set for your environment.`);
    console.error(`\n - The botFileSecret is available under appsettings for your Azure Bot Service bot.`);
    console.error(`\n - If you are running this bot locally, consider adding a .env file with botFilePath and botFileSecret.`);
    console.error(`\n - See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.\n\n`);
    process.exit();
}

// Get bot endpoint configuration by service name
const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.
const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
});
// console.log("list");
// console.log(process.env.microsoftAppID);
// console.log(process.env.microsoftAppPassword);
// console.log("done");
// console.log(BOT_CONFIGURATION);
// console.log(endpointConfig.appId);
// console.log(endpointConfig.appPassword );
// console.log(endpointConfig);

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    await context.sendActivity(`Oops. Something went wrong!`);
};
// Define a state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.
let userState;


//For Azure Development, access and save Azure memory
//CAUTION:: Use local development for testing
// http://localhost:3978/api/messages
//keys encrypted: MbaGQD5Acy7+p6UBXvNBEQWV8nAqSs+F768cnKYKmJc=
//Add CosmosDB 
// const storage = new CosmosDbStorage({
//     serviceEndpoint: process.env.ACTUAL_SERVICE_ENDPOINT, 
//     authKey: process.env.ACTUAL_AUTH_KEY, 
//     databaseId: process.env.DATABASE,
//     collectionId: process.env.COLLECTION
// })


// //Blob Storage
// // storage = new BlobStorage({
// //    "amicus123",
// //    "DefaultEndpointsProtocol=https;AccountName=amicus123;AccountKey=VeclGls4vOtaIhIjnSHQiXoSwI0DrdWoV0yANalAFVLsPPwNEtZXTItdWNfPdDRSXZbJ/lRwGyLTUffnCAzzyg==;EndpointSuffix=core.windows.net",
// //    "VeclGls4vOtaIhIjnSHQiXoSwI0DrdWoV0yANalAFVLsPPwNEtZXTItdWNfPdDRSXZbJ/lRwGyLTUffnCAzzyg=="
// // });

// const conversationState = new ConversationState(storage);
// userState = new UserState(storage);
// adapter.use(conversationState);



// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
userState = new UserState(memoryStorage);
const conversationState = new ConversationState(memoryStorage);

// Create the main dialog.
const myBot = new MyBot(conversationState, userState);

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await myBot.onTurn(context);
    });
});