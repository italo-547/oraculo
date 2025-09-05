// Endpoint adicional para reforçar sinal de API
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ status: 'ok', arquetipo: 'fullstack-hibrido' });
}
