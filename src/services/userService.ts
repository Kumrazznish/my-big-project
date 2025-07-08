import axios from 'axios';
import { UserProfile, LearningHistory } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class UserService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async getOrCreateUser(userData: {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
  }): Promise<UserProfile> {
    try {
      const response = await this.api.post('/users/get-or-create', userData);
      return response.data;
    } catch (error) {
      console.error('Error getting or creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await this.api.put(`/users/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async getUserHistory(userId: string): Promise<LearningHistory[]> {
    try {
      const response = await this.api.get(`/users/${userId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error getting user history:', error);
      throw error;
    }
  }

  async addToHistory(userId: string, historyData: {
    subject: string;
    difficulty: string;
    roadmapId: string;
    chapterProgress: { chapterId: string; completed: boolean; completedAt?: Date }[];
    learningPreferences: {
      learningStyle: string;
      timeCommitment: string;
      goals: string[];
    };
  }): Promise<LearningHistory> {
    try {
      const response = await this.api.post(`/users/${userId}/history`, historyData);
      return response.data;
    } catch (error) {
      console.error('Error adding to history:', error);
      throw error;
    }
  }

  async updateChapterProgress(userId: string, historyId: string, chapterId: string, completed: boolean): Promise<void> {
    try {
      await this.api.put(`/users/${userId}/history/${historyId}/chapter/${chapterId}`, {
        completed,
        completedAt: completed ? new Date() : null
      });
    } catch (error) {
      console.error('Error updating chapter progress:', error);
      throw error;
    }
  }
}

export const userService = new UserService();