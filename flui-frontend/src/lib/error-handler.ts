/**
 * Tratamento centralizado de erros da API
 * Garante que erros não quebrem a aplicação
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

/**
 * Extrai mensagem de erro de forma segura
 */
export function extractErrorMessage(error: any): string {
  // Se for uma string, retorna direto
  if (typeof error === 'string') {
    return error;
  }

  // Se tiver message
  if (error?.message) {
    return error.message;
  }

  // Se for resposta de API
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Se for erro de rede
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ERR_NETWORK') {
    return 'Erro de conexão com o servidor. Verifique sua internet e tente novamente.';
  }

  // Mensagem padrão
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

/**
 * Wrapper para chamadas de API com tratamento de erro automático
 */
export async function apiCall<T>(
  fn: () => Promise<T>,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    console.error('API Error:', error);
    
    // Log do erro (pode ser enviado para serviço de monitoramento)
    logError(error);

    // Retorna valor de fallback se fornecido
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    // Re-throw se não houver fallback (para que o componente possa tratar)
    throw error;
  }
}

/**
 * Wrapper para chamadas de API que devem ser silenciosas (não mostrar erro ao usuário)
 */
export async function silentApiCall<T>(
  fn: () => Promise<T>,
  defaultValue: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn('Silent API call failed:', error);
    logError(error);
    return defaultValue;
  }
}

/**
 * Tenta executar uma função várias vezes antes de falhar
 */
export async function retryApiCall<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`API call failed (attempt ${i + 1}/${retries}):`, error);

      if (i < retries - 1) {
        // Aguarda antes de tentar novamente (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
}

/**
 * Log de erros (pode ser integrado com serviço de monitoramento)
 */
function logError(error: any) {
  const errorData: ApiError = {
    message: extractErrorMessage(error),
    code: error?.code,
    status: error?.response?.status,
    details: error?.response?.data || error,
  };

  // Em produção, enviar para serviço de monitoramento (Sentry, etc.)
  if (process.env.NODE_ENV === 'production') {
    // sendToMonitoringService(errorData);
  }

  // Log estruturado no console
  console.error('[Error Handler]', {
    timestamp: new Date().toISOString(),
    ...errorData,
  });
}

/**
 * Verifica se um erro é de rede/conectividade
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'ECONNREFUSED' ||
    error?.code === 'ERR_NETWORK' ||
    error?.message?.includes('Network Error') ||
    error?.message?.includes('Failed to fetch')
  );
}

/**
 * Verifica se um erro é de autenticação
 */
export function isAuthError(error: any): boolean {
  return error?.response?.status === 401 || error?.response?.status === 403;
}

/**
 * Verifica se um erro é de validação
 */
export function isValidationError(error: any): boolean {
  return error?.response?.status === 400 || error?.response?.status === 422;
}
