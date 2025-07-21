import express, { Request, Response } from 'express';
import {
  getCardsInList,
  updateCardName,
  moveCardToTop,
  getMonitorableListIds
} from './trello';
import { parseQuantidadeFromTitle } from './utils';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const boardId = process.env.TRELLO_BOARD_ID!;
let monitoredLists: string[] = [];

async function initializeMonitoredLists(): Promise<void> {
  monitoredLists = await getMonitorableListIds(boardId);
  console.log("Listas monitoradas:", monitoredLists);
}

// Tipagem básica da estrutura esperada no req.body
interface TrelloWebhookAction {
  data: {
    list?: {
      id: string;
    };
  };
}

interface TrelloCard {
  id: string;
  name: string;
}

app.head('/webhook', (_req: Request, res: Response): void => {
  res.sendStatus(200);
});

app.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const action: TrelloWebhookAction = req.body.action;
    if (!action?.data?.list?.id){ 
      res.sendStatus(200);
      return;
    }
    const listId: string = action.data.list.id;
    //First check
    if (!monitoredLists.includes(listId)) {
      await initializeMonitoredLists()
      //Second check (same as first after reinit lists)
      if (!monitoredLists.includes(listId)) {
        res.sendStatus(200);
        return;
      }
    } 

    console.log(`Recontando lista: ${listId}`);

    const cards: TrelloCard[] = await getCardsInList(listId);

    let total: number = 0;
    let contadorCardId: string | null = null;

    for (const card of cards) {
      const parsed: number = parseQuantidadeFromTitle(card.name);
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
