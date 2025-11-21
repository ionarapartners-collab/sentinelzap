// ✅ VERSÃO DEFINITIVA - COM TODAS AS EXPORTAÇÕES NECESSÁRIAS

// Configurações da Aplicação
export const APP_CONFIG = {
  name: 'SentinelZap',
  title: 'SentinelZap - Sistema de Rotação WhatsApp',
  logo: '/logo.png',
  version: '1.0.0'
};

// ✅ CORREÇÃO CRÍTICA: Exportação que estava faltando!
export const APP_TITLE = APP_CONFIG.title;

// Configurações da API
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000
};

// Configurações de Analytics (desabilitadas localmente)
export const ANALYTICS_CONFIG = {
  endpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT || '',
  websiteId: import.meta.env.VITE_ANALYTICS_WEBSITE_ID || '',
  enabled: false // Desabilitado em desenvolvimento
};

// Função de login simplificada
export function getLoginUrl(): string {
  return "/dashboard";
}

// Exportação padrão para compatibilidade
export default {
  APP_CONFIG,
  APP_TITLE, // ✅ ADICIONADO
  API_CONFIG,
  ANALYTICS_CONFIG,
  getLoginUrl
};
