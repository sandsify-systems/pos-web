import apiClient from "@/lib/api";

export interface Tutorial {
  id: number;
  topic: string;
  title: string;
  content: string;
  display_order: number;
}

export const tutorialService = {
  getTutorials: async (type: string) => {
    const response = await apiClient.get(`/tutorials?type=${type}`);
    return response.data;
  },
};
