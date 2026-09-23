import api from "../api/axios";

export interface Plan {
  _id?: string;
  title: string;
  description: string;
  category: string;
  image: string;
  price: number;
  duration: number;
  durationHours: number;
  durationMinutes: number;
  returnAmount: number;
  displayOrder: number;
  status: boolean;
}

// Get All Plans
export const getPlans = async () => {
  const res = await api.get("/plans");
  return res.data;
};

// Get Single Plan
export const getPlan = async (id: string) => {
  const res = await api.get(`/plans/${id}`);
  return res.data;
};

// Create Plan
export const createPlan = async (data: Plan) => {
  const res = await api.post("/plans", data);
  return res.data;
};

// Update Plan
export const updatePlan = async (
  id: string,
  data: Partial<Plan>
) => {
  const res = await api.put(`/plans/${id}`, data);
  return res.data;
};

// Delete Plan
export const deletePlan = async (id: string) => {
  const res = await api.delete(`/plans/${id}`);
  return res.data;
};