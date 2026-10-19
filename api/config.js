// Archivo dado de baja: ningún componente del proyecto consume /api/config
export default function handler(req, res) {
  return res.status(404).json({ error: 'Endpoint removed' });
}
