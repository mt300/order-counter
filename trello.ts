import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const { TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID, APP_URL } = process.env;

async function main() {
  const webhookUrl = `${APP_URL}/webhook`;
  if (!webhookUrl) throw new Error('Defina WEBHOOK_URL no .env');

  const url = `https://api.trello.com/1/webhooks?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
  const res = await axios.post(url, {
    callbackURL: webhookUrl,
    idModel: TRELLO_BOARD_ID,
    description: 'Monitoramento automático de listas com contador',
  });

  console.log('Webhook criado:', res.data);
}

main().catch(console.error);

const baseURL = 'https://api.trello.com/1';

export async function getCardsInList(listId: string) {
  const url = `${baseURL}/lists/${listId}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
  const res = await axios.get(url);
  return res.data;
}

export async function updateCardName(cardId: string, newName: string) {
    console.log(`UPDATING CARD: cardId ${cardId}, newName ${newName}`)
  const url = `${baseURL}/cards/${cardId}?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
  return axios.put(url, { name: newName });
}

export async function moveCardToTop(cardId: string) {
    console.log("MOVING CARD TO TOP: " + cardId)
    const url = `${baseURL}/cards/${cardId}/pos?value=top&key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
    return axios.put(url);
}


export async function getListsInBoard(boardId: string) {
  const url = `${baseURL}/boards/${boardId}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
  const res = await axios.get(url);
  return res.data;
}

export async function getMonitorableListIds(boardId: string): Promise<string[]> {
  const lists = await getListsInBoard(boardId);
  const result: string[] = [];

  for (const list of lists) {
    const cards = await getCardsInList(list.id);
    const hasContadorCard = cards.some(card =>
      /^\d+(\.\d{3})*\s*-\s*PEÇAS$/i.test(card.name.trim())
    );
    if (hasContadorCard) {
      result.push(list.id);
    }
  }

  return result;
}
