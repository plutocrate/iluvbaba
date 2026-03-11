/**
 * API Client - Handles all server communication
 */

const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('jwt_token');
  }

  setToken(token, username) {
    this.token = token;
    if (token) {
      localStorage.setItem('jwt_token', token);
      if (username) localStorage.setItem('jwt_username', username);
    } else {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('jwt_username');
    }
  }

  getUsername() {
    return localStorage.getItem('jwt_username') || '';
  }

  getToken() {
    return this.token;
  }

  isLoggedIn() {
    return !!this.token;
  }

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(API_BASE + path, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (e) {
      throw e;
    }
  }

  // Auth
  async register(username, password) {
    const data = await this.request('POST', '/auth/register', { username, password });
    if (data.token) this.setToken(data.token, data.username);
    return data;
  }

  async login(username, password) {
    const data = await this.request('POST', '/auth/login', { username, password });
    if (data.token) this.setToken(data.token, data.username);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  async getProfile() {
    return this.request('GET', '/auth/profile');
  }

  // Maps
  async getMaps(sort = 'top', page = 1) {
    return this.request('GET', `/maps?sort=${sort}&page=${page}`);
  }

  async getMap(id) {
    return this.request('GET', `/maps/${id}`);
  }

  async publishMap(title, mapJson) {
    return this.request('POST', '/maps', { title, map_json: mapJson });
  }

  async updateMap(id, title, mapJson) {
    return this.request('PUT', `/maps/${id}`, { title, map_json: mapJson });
  }

  async deleteMap(id) {
    return this.request('DELETE', `/maps/${id}`);
  }

  // Voting
  async vote(mapId, voteType) {
    // Check localStorage for existing vote
    const voteKey = `vote_${mapId}`;
    const existing = localStorage.getItem(voteKey);

    if (existing === voteType) {
      // Remove vote
      localStorage.removeItem(voteKey);
      return this.request('POST', '/vote', { map_id: mapId, vote: 'remove' });
    }

    localStorage.setItem(voteKey, voteType);
    return this.request('POST', '/vote', { map_id: mapId, vote: voteType });
  }

  getLocalVote(mapId) {
    return localStorage.getItem(`vote_${mapId}`);
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('POST', '/auth/change-password', { currentPassword, newPassword });
  }

  async getMyMaps() {
    return this.request('GET', '/maps/mine');
  }

  async deleteMap(id) {
    return this.request('DELETE', `/maps/${id}`);
  }

  async changeUsername(username) {
    const data = await this.request('POST', '/auth/change-username', { username });
    if (data.token) this.setToken(data.token, data.username);
    return data;
  }
}

export const api = new ApiClient();
