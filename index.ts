import express from 'express';
import { getCardsInList, updateCardName, moveCardToTop, getMonitorableListIds } from './trello';
import { parseQuantidadeFromTitle } from './utils';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const boardId = process.env.TRELLO_BOARD_ID!;
let monitoredLists: string[] = [];

async function initializeMonitoredLists() {
  monitoredLists = await getMonitorableListIds(boardId);
  console.log("Listas monitoradas:", monitoredLists);
}

app.head('/webhook', (req, res) => {
  res.sendStatus(200);
});

app.post('/webhook', async (req, res) => {
  try {
    const action = req.body.action;
    if (!action?.data?.list?.id) return res.sendStatus(200);

    const listId = action.data.list.id;
    if (!monitoredLists.includes(listId)) return res.sendStatus(200);

    console.log(`Recontando lista: ${listId}`);

    const cards = await getCardsInList(listId);

    let total = 0;
    let contadorCardId = null;

    for (const card of cards) {
      const parsed = parseQuantidadeFromTitle(card.name);
      total += parsed;

      if (/^\d+(\.\d{3})*\s*-\s*PEÇAS$/i.test(card.name.trim())) {
        contadorCardId = card.id;
      }
    }

    if (contadorCardId) {
      await updateCardName(contadorCardId, `${total} - PEÇAS`);
      await moveCardToTop(contadorCardId);
      console.log(`Atualizado contador da lista ${listId}: ${total} peças`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
  await initializeMonitoredLists();
});
