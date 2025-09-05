// Arquétipo: Fullstack Híbrido (React + Express + Next)
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../pages')));

// Sinal típico de backend Express para fullstack
app.get('/api', (req, res) => {
  res.json({
    ok: true,
    feature: 'fullstack-hibrido',
    mensagem: 'API do backend Express',
    arquetipo: 'api-rest-express',
  });
});

app.get('/about', (req, res) => {
  res.send('Página About do Fullstack Híbrido');
});

app.get('/', (req, res) => {
  res.send('Backend Fullstack Híbrido');
});

// Sinal típico de API REST Express
app.get('/users', (req, res) => {
  res.json([{ id: 1, nome: 'Usuário Fullstack', arquetipo: 'api-rest-express' }]);
});
app.get('/user/:id', (req, res) => {
  res.json({ user: 'demo', arquetipo: 'api-rest-express', id: req.params.id });
});
app.post('/users', (req, res) => {
  res.status(201).json({ created: true, arquetipo: 'api-rest-express' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', arquetipo: 'fullstack-hibrido' });
});

app.listen(4000, () => {
  console.log('Fullstack rodando na porta 4000');
});
