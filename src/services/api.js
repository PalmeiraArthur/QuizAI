import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Erro na resposta:', error.response.data);
      
      const errorMessage = error.response.data?.message || 
                          error.response.data?.detail || 
                          'Erro ao processar requisição';
      
      switch (error.response.status) {
        case 400:
          console.error('Bad Request:', errorMessage);
          break;
        case 404:
          console.error('Recurso não encontrado:', errorMessage);
          break;
        case 422:
          console.error('Erro de processamento:', errorMessage);
          break;
        case 500:
          console.error('Erro interno do servidor');
          break;
        default:
          console.error('Erro desconhecido');
      }
      
      return Promise.reject({
        status: error.response.status,
        message: errorMessage,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('Servidor não respondeu:', error.request);
      return Promise.reject({
        message: 'Servidor não está respondendo. Verifique se o backend está rodando.'
      });
    } else {
      console.error('Erro na requisição:', error.message);
      return Promise.reject({
        message: error.message
      });
    }
  }
);

export default api;