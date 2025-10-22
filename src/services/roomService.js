import api from './api';

const roomService = {

  // 🔹 Cria uma sala com validação do ownerId
  createRoom: async (ownerId, isPublic = true, maxNumberOfPlayers = 10) => {
    if (!ownerId) {
      console.error('❌ Erro: ownerId não encontrado ao criar sala');
      throw new Error('Usuário não identificado. Faça login novamente.');
    }

    console.log('🟢 Criando sala para o usuário:', ownerId);

    const response = await api.post('/rooms', {
      ownerId, // ⚠️ Confirme no backend se o campo é exatamente "ownerId"
      isPublic,
      maxNumberOfPlayersInRoom: maxNumberOfPlayers
    });

    console.log('✅ Sala criada com sucesso:', response.data);

    return response.data;
  },

  // 🔹 Atualiza sala (vincula quiz, muda opções, etc)
  updateRoom: async (roomId, ownerId, quizId, options = {}) => {
    if (!roomId || !ownerId) {
      console.error('❌ updateRoom chamado sem roomId ou ownerId', { roomId, ownerId });
      throw new Error('Dados inválidos para atualização da sala.');
    }

    console.log('🟢 Atualizando sala:', roomId, 'com ownerId:', ownerId);

    const response = await api.patch(`/rooms/${roomId}`, {
      ownerId,
      quizId,
      ...options
    });

    console.log('✅ Sala atualizada com sucesso:', response.data);
    return response.data;
  },

  // 🔹 Deleta sala
  deleteRoom: async (roomId, userId) => {
    if (!roomId || !userId) {
      console.error('❌ deleteRoom chamado sem roomId ou userId', { roomId, userId });
      throw new Error('Dados inválidos para deletar sala.');
    }

    console.log('🟠 Deletando sala:', roomId, 'com userId:', userId);

    const response = await api.delete(`/rooms/${roomId}`, {
      data: JSON.stringify(userId),
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Sala deletada com sucesso');
    return response.data;
  },

  // 🔹 Busca todas as salas públicas
  getPublicRooms: async () => {
    console.log('🔍 Buscando salas públicas...');
    const response = await api.get('/rooms', {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  // tenta obter a sala do owner (vários endpoints / fallback)
  getRoomByOwner: async (ownerId) => {
    if (!ownerId) throw new Error('ownerId required');

    // 1) endpoint específico (se existir)
    try {
      const resp = await api.get(`/rooms/owner/${ownerId}`);
      if (resp?.data) return resp.data;
    } catch (e) {
      // ignora e tenta outras opções
      console.debug('rooms/owner endpoint não disponível ou retornou erro', e?.message || e);
    }

    // 2) query por ownerId (retorna array)
    try {
      const resp = await api.get(`/rooms`, { params: { ownerId } });
      const data = resp?.data;
      if (Array.isArray(data) && data.length) {
        // retorna a primeira sala do owner
        return data[0];
      }
      // se backend retorna objeto, retorne-o
      if (data && data.ownerId === ownerId) return data;
    } catch (e) {
      console.debug('GET /rooms?ownerId erro', e?.message || e);
    }

    // 3) fallback: buscar salas públicas e filtrar localmente
    try {
      const publicRooms = await roomService.getPublicRooms();
      const found = publicRooms.find(r => String(r.ownerId) === String(ownerId));
      if (found) return found;
    } catch (e) {
      console.debug('fallback getPublicRooms falhou', e?.message || e);
    }

    return null;
  }
};

export default roomService;
