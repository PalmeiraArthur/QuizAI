import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    timeout: 30000,
    headers: {
        'Content-Type': undefined,
        'Accept': 'application/json'
        
    }
});

api.defaults.headers.post['Content-Type'] = 'application/json';
api.defaults.headers.put['Content-Type'] = 'application/json';
api.defaults.headers.patch['Content-Type'] = 'application/json';

api.defaults.headers.get['Content-Type'] = undefined; // <--- Linha Crítica



//Função utilitária para extrair a mensagem de erro mais relevante do corpo da resposta do Spring.

const extractErrorMessage = (errorData) => {
    // Tenta obter a mensagem padrão do Spring (detail ou message)
    return errorData?.message ||
        errorData?.detail ||
        'Ocorreu um erro desconhecido.';
}

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // --- 1. Resposta do Servidor Recebida (erros 4xx, 5xx) ---
        if (error.response) {
            const { status, data } = error.response;
            const customMessage = extractErrorMessage(data);

            // Log detalhado para depuração no console
            console.error(`[API ERROR] Status ${status}: ${customMessage}`, data);

            // Adiciona uma mensagem de log mais amigável no console, se necessário
            switch (status) {
                case 400:
                    console.warn('Requisição Inválida (400): Verifique os dados enviados.');
                    break;
                case 404:
                    // Exceções como RoomNotFound e UserNotFound caem aqui.
                    console.warn('Recurso Não Encontrado (404): URL ou ID não existem.');
                    break;
                case 401:
                case 403:
                    // Bom ponto para adicionar lógica de logout ou refresh de token
                    console.error('Acesso Negado (401/403).');
                    break;
                case 500:
                    console.error('Erro Interno do Servidor (500).');
                    break;
                // Os outros status (422, etc.) são tratados pelo log geral.
            }

            // Rejeita a Promise com um objeto de erro padronizado para o frontend consumir
            return Promise.reject({
                status: status,
                message: customMessage, // Mensagem específica do backend
                data: data // O corpo completo do erro para análise
            });
        }

        // --- 2. Requisição Enviada, mas Sem Resposta (Timeout, Servidor Offline) ---
        else if (error.request) {
            console.error('[API ERROR] ⚠️ Servidor não respondeu. Requisição enviada, mas sem resposta.', error.request);
            return Promise.reject({
                message: 'Servidor offline ou sem resposta. Verifique a conexão com o backend.'
            });
        }

        // --- 3. Erro ao Configurar a Requisição (Erro de Código) ---
        else {
            console.error('[API ERROR] 💥 Erro ao configurar a requisição:', error.message);
            return Promise.reject({
                message: error.message
            });
        }
    }
);

export default api;