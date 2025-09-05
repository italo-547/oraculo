// Arquétipo: API REST Express
import express from 'express';
import bodyParser from 'body-parser';
import { userController, getUser } from './controllers/userController';

const app = express();
app.use(bodyParser.json());
app.use(express.json());

// Sinal típico de controller REST
app.get('/users', userController);
app.get('/user/:id', getUser);
app.post('/users', (req, res) => {
  res.status(201).json({ created: true, arquetipo: 'api-rest-express' });
});

// Sinal típico de API REST Express
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', arquetipo: 'api-rest-express' });
});

// Sinal de rota de listagem
app.get('/api/list', (req, res) => {
  res.json([{ id: 1, nome: 'Usuário Exemplo' }]);
});

app.listen(3000, () => {
  console.log('API REST Express rodando na porta 3000');
});

// Fixture mínimo para API REST Express
export const api = () => 'api-rest-express';
