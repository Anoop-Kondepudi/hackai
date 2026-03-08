import express from 'express';
import cors from 'cors';
import { ensureTodoStore } from './lib/todoStore.js';
import todoRoutes from './routes/todos.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/api/todos', todoRoutes);

async function bootstrap() {
  try {
    await ensureTodoStore();

    app.listen(PORT, () => {
      console.log(`Demo API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize todo store', error);
    process.exit(1);
  }
}

void bootstrap();
