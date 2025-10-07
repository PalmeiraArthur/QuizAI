
import api from './api';

const userService = {

  createUser: async (username) => {
    const response = await api.post('/user', { username });
    return response.data;
  }
};

export default userService;