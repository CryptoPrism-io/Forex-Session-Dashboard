export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'Forex Dashboard API is running',
    timestamp: new Date().toISOString()
  });
}
