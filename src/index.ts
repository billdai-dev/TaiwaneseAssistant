import { dialogflow, JsonObject } from 'actions-on-google';

// Import the firebase-functions package for deployment.
import functions = require('firebase-functions');

// Instantiate the Dialogflow client.
const app = dialogflow({ debug: true });

const question = "q";
const options = "options";
const answer = "answer";

const dataset = [{ "id": 0, [question]: "請問氣ㄆ是什麼？", [answer]: "草莓", [options]: ["氣泡", "草莓", "刺蝟"] },
{ "id": 1, [question]: "請問<sub alias='嗨骯'>海翁</sub>是什麼？", [answer]: "鯨魚", [options]: ["鯊魚", "海豚", "鯨魚"] }
];
// Define a mapping of fake color strings to basic card objects.
// const colorMap = {
//   'indigo taco': {
//     title: 'Indigo Taco',
//     text: 'Indigo Taco is a subtle bluish tone.',
//     image: {
//       url: 'https://storage.googleapis.com/material-design/publish/material_v_12/assets/0BxFyKV4eeNjDN1JRbF9ZMHZsa1k/style-color-uiapplication-palette1.png',
//       accessibilityText: 'Indigo Taco Color',
//     },
//     display: 'WHITE',
//   },
//   'pink unicorn': {
//     title: 'Pink Unicorn',
//     text: 'Pink Unicorn is an imaginative reddish hue.',
//     image: {
//       url: 'https://storage.googleapis.com/material-design/publish/material_v_12/assets/0BxFyKV4eeNjDbFVfTXpoaEE5Vzg/style-color-uiapplication-palette2.png',
//       accessibilityText: 'Pink Unicorn Color',
//     },
//     display: 'WHITE',
//   },
//   'blue grey coffee': {
//     title: 'Blue Grey Coffee',
//     text: 'Calling out to rainy days, Blue Grey Coffee brings to mind your favorite coffee shop.',
//     image: {
//       url: 'https://storage.googleapis.com/material-design/publish/material_v_12/assets/0BxFyKV4eeNjDZUdpeURtaTUwLUk/style-color-colorsystem-gray-secondary-161116.png',
//       accessibilityText: 'Blue Grey Coffee Color',
//     },
//     display: 'WHITE',
//   },
// };

// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
  conv.ask(`<speak>歡迎來到台語隨堂考！<sub alias='你'>你/妳</sub>，準備好接受測驗了嗎？</speak>`);
});

app.intent('Default Welcome Intent - yes', (conv) => {
  const total = Math.min(5, dataset.length);
  const shuffledDataset = shuffle(dataset);
  const order: number[] = [];
  for (let i = 0; i < total && i < shuffledDataset.length; i++) {
    order.push(shuffledDataset[i].id);
  }
  const data = conv.data as JsonObject;
  data.total = total;
  data.order = order;
  data.count = 1;
  conv.contexts.set("reply", 2);
  conv.ask(`測驗開始！第 1 題：`);
  conv.add(`<speak>${dataset[order[0]][question]}</speak>`);
});

app.intent('reply', (conv) => {
  const data = conv.data as JsonObject;
  const total = data.total;
  const order: number[] = data.order;
  let score = data.score;
  score = score === null || score === undefined ? 0 : score;
  let count = data.count;

  const query = conv.query;
  let isCorrect = false;
  let response = "";

  //Check whether answer is correct
  const correctAnswer = dataset[order[count - 1]][answer];
  isCorrect = query.search(correctAnswer) > -1;
  response += isCorrect ? `恭喜答對！` : `答錯了！正確答案為 ${correctAnswer}`;
  response += "\n";
  if (isCorrect) {
    score++;
  }
  //Check total count
  if (count === total) {
    response += `測驗結束。\n你獲得了${score}分！`;
    conv.close("<speak>" + response + "</speak>");
    return;
  }
  //Next question
  count++;
  const nextQuest = dataset[order[count - 1]];
  response += `第 ${count} 題\n`;
  response += nextQuest[question];

  // for (const quest of dataset) {
  //   const id = quest.id;
  //   if (!ids.includes(id)) {
  //     ids.push(id);
  //     data.ids = ids;

  //     //conv.add(`第 ${count + 1} 題：${quest[question]}`);
  //     //conv.add(`${quest[question]}`);
  //   }
  // }
  data.count = count;
  data.score = score;
  conv.contexts.set("reply", 2);
  conv.ask("<speak>" + response + "</speak>");
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


