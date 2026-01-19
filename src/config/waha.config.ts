import { registerAs } from '@nestjs/config';

export default registerAs('waha', () => {
  // WAHA gera uma nova API Key a cada inicialização se não encontrar uma persistida
  // Vamos tentar descobrir a API Key dinamicamente ou usar a última conhecida
  const apiKey = process.env.WAHA_API_KEY || '';
  
  return {
    baseUrl: process.env.WAHA_BASE_URL || 'http://localhost:3002',
    apiKey: apiKey,
    webhookUrl: process.env.WAHA_WEBHOOK_URL || '',
    timeout: parseInt(process.env.WAHA_TIMEOUT || '30000', 10),
  };
});
