import api from "../api/axios";

export const getSettings = async () => {
  const res = await api.get("/settings");
  return res.data;
};

export const updateSettings = async (data: Record<string, unknown>) => {
  const res = await api.put("/settings", data);
  return res.data;
};
