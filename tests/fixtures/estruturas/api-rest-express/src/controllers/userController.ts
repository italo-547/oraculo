import { Request, Response } from 'express';

// Sinal típico de controller para Express
export function getUser(req: Request, res: Response) {
  res.json({ user: 'demo', arquetipo: 'api-rest-express', id: req.params.id });
}

export function userController(req: Request, res: Response) {
  res.json({ id: 1, nome: 'Usuário Exemplo', arquetipo: 'api-rest-express' });
}
