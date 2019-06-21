import { dialogflow, JsonObject, Suggestions } from 'actions-on-google';
import * as i18n from 'i18n';
//import * as moment from 'moment';

// Import the firebase-functions package for deployment.
import functions = require('firebase-functions');

// Instantiate the Dialogflow client.
const app = dialogflow({ debug: true });

i18n.configure({
  locales: ['en-US', 'zh-TW'],
  directory: __dirname + '/locales',
  defaultLocale: 'en-US',
  objectNotation: true
});
app.middleware((conv) => {
  i18n.setLocale(conv.user.locale);
});

app.intent('Default Welcome Intent - yes', (conv) => {
  const dataset: JsonObject[] = JSON.parse(JSON.stringify(i18n.__("DATASET")));
  const repeatOption: Suggestions = new Suggestions(i18n.__("OPTION_REPEAT"));

  const total = Math.min(5, dataset.length);
  const shuffledDataset = shuffle(dataset.slice());
  const order: number[] = [];
  for (let i = 0; i < total && i < shuffledDataset.length; i++) {
    order.push(shuffledDataset[i].id);
  }
  const data = conv.data as JsonObject;
  data.total = total;
  data.order = order;
  data.count = 1;
  conv.contexts.set("reply", 2);
  console.log(`Order: ${order[0]}, data:${dataset[order[0]]}`);
  const options: string[] = dataset[order[0]]["options"];
  const suggestions: Suggestions = new Suggestions(options);
  const firstQuestion = dataset[order[0]]["question"];
  console.log("quest:" + firstQuestion);
  conv.ask(`<speak><p>${i18n.__("RESPONSE_WELCOME_YES")}${i18n.__("QUESTION", "1", firstQuestion)}</p></speak>`, suggestions, repeatOption);
});

app.intent(["reply"], (conv) => {
  const dataset: JsonObject[] = JSON.parse(JSON.stringify(i18n.__("DATASET")));
  const repeatOption: Suggestions = new Suggestions(i18n.__("OPTION_REPEAT"));

  const data = conv.data as JsonObject;
  const total = data.total;
  const order: number[] = data.order;
  let score: number = data.score;
  score = score === null || score === undefined ? 0 : score;
  let count: number = data.count;

  const query = conv.query;
  let isCorrect = false;
  let response = "";

  //Check whether answer is correct
  const correctAnswer = dataset[order[count - 1]]["answer"];
  isCorrect = query.search(correctAnswer) > -1;
  response += isCorrect
    ? `${i18n.__("RESPONSE_CORRECT_ANSWER")}`
    : `${i18n.__("RESPONSE_INCORRECT_ANSWER", correctAnswer)}`;

  if (isCorrect) {
    score++;
  }
  //Check total count
  if (count === total) {
    const scoreRatio = score / total;
    let comment = "";
    if (scoreRatio <= 0.25) {
      comment = i18n.__("COMMENT_BAD");
    }
    else if (scoreRatio <= 0.5) {
      comment = i18n.__("COMMENT_OKAY");
    }
    else if (scoreRatio <= 0.75) {
      comment = i18n.__("COMMENT_GOOD");
    }
    else {
      comment = i18n.__("COMMENT_EXCELLENT");
    }
    response += `${i18n.__("RESPONSE_QUIZ_FINISHED", score.toString(), comment)}`;
    conv.close("<speak><p>" + response + "</p></speak>");
    return;
  }
  //Next question
  count++;
  const nextQuest = dataset[order[count - 1]];
  response += `${i18n.__("QUESTION", count.toString(), nextQuest["question"])}`;
  const options: string[] = nextQuest["options"];
  const suggestions: Suggestions = new Suggestions(options);

  data.count = count;
  data.score = score;
  conv.contexts.set("reply", 2);
  conv.ask("<speak><p>" + response + "</p></speak>", suggestions, repeatOption);
});

app.intent("reply - repeat", (conv) => {
  const dataset: JsonObject[] = JSON.parse(JSON.stringify(i18n.__("DATASET")));
  const repeatOption: Suggestions = new Suggestions(i18n.__("OPTION_REPEAT"));

  const data = conv.data as JsonObject;
  const order: number[] = data.order;
  const count: number = data.count;

  let response = "";

  //Repeat question
  const quest = dataset[order[count - 1]];
  response += `${i18n.__("QUESTION", count.toString(), quest["question"])}`;
  const options: string[] = quest["options"];
  const suggestions: Suggestions = new Suggestions(options);

  conv.contexts.set("reply", 2);
  conv.ask("<speak><p>" + response + "</p></speak>", suggestions, repeatOption);
});

function shuffle<T>(arr: T[]): T[] {
  let j, x, i;
  for (i = arr.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = arr[i];
    arr[i] = arr[j];
    arr[j] = x;
  }
  return arr;
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);


