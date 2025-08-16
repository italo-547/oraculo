// Mock API endpoint para sinalizar pasta api
export default function handler(req, res) {
  res.status(200).json({ mensagem: 'API mock fullstack-hibrido' });
}
