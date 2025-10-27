import { toast } from '@/hooks/use-toast';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export function handleApiError(error: any): ApiError {
  console.error('[API Error]', error);

  // Se j\u00e1 \u00e9 um erro formatado
  if (error.message && error.status) {
    return error;
  }

  // Erro de rede
  if (error.message?.includes('fetch') || error.message?.includes('NetworkError')) {
    return {
      message: 'Erro de conex\u00e3o. Verifique sua internet e tente novamente.',
      status: 0,
      code: 'NETWORK_ERROR',
    };
  }

  // Erro de resposta HTTP
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    return {
      message: data?.message || getDefaultErrorMessage(status),
      status,
      code: data?.code || `HTTP_${status}`,
    };
  }

  // Erro gen\u00e9rico
  return {
    message: error.message || 'Ocorreu um erro inesperado',
    status: 500,
    code: 'UNKNOWN_ERROR',
  };
}

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Requisi\u00e7\u00e3o inv\u00e1lida';
    case 401:
      return 'N\u00e3o autorizado';
    case 403:
      return 'Acesso negado';
    case 404:
      return 'Recurso n\u00e3o encontrado';
    case 409:
      return 'Conflito de dados';
    case 422:
      return 'Dados inv\u00e1lidos';
    case 429:
      return 'Muitas requisi\u00e7\u00f5es. Aguarde um momento.';
    case 500:
      return 'Erro interno do servidor';
    case 503:
      return 'Servi\u00e7o indispon\u00edvel';
    default:
      return `Erro ${status}`;
  }
}

export function showErrorToast(error: any, title?: string) {
  const apiError = handleApiError(error);
  
  toast({
    title: title || 'Erro',
    description: apiError.message,
    variant: 'destructive',
  });
}

export function isRecoverableError(error: ApiError): boolean {
  // Erros que n\u00e3o devem quebrar a aplica\u00e7\u00e3o
  const recoverableCodes = [
    'NETWORK_ERROR',
    'HTTP_404',
    'HTTP_409',
    'HTTP_422',
    'HTTP_429',
  ];

  return error.code ? recoverableCodes.includes(error.code) : true;
}

// Wrapper para chamadas de API com tratamento de erro
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options?: {
    showToast?: boolean;
    toastTitle?: string;
    onError?: (error: ApiError) => void;
  }
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    const apiError = handleApiError(error);

    if (options?.showToast !== false) {
      showErrorToast(apiError, options?.toastTitle);
    }

    if (options?.onError) {
      options.onError(apiError);
    }

    // Se \u00e9 um erro recover\u00e1vel, retorna null para continuar
    if (isRecoverableError(apiError)) {
      return null;
    }

    // Se n\u00e3o \u00e9 recover\u00e1vel, propaga o erro
    throw error;
  }
}
