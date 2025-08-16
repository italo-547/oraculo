import { Request, Response } from 'express';

export function healthController(req: Request, res: Response) {
  res.json({ status: 'ok', arquetipo: 'api-rest-express' });
}
