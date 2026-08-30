import api from '../api/axios';

export const getCdmSetting = async () => {
  const res = await api.get('/cdm/setting');
  return res.data;
};

export const updateCdmSetting = async (image: File | null, description: string) => {
  const formData = new FormData();

  if (image) {
    formData.append('image', image);
  }

  formData.append('description', description);

  const res = await api.put('/cdm/setting', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return res.data;
};

export const getCdmRequests = async () => {
  const res = await api.get('/cdm/admin');
  return res.data;
};

export const updateCdmRequestStatus = async (id: string, status: string) => {
  const res = await api.put(`/cdm/admin/${id}`, { status });
  return res.data;
};

export const deleteCdmRequest = async (id: string) => {
  const res = await api.delete(`/cdm/admin/${id}`);
  return res.data;
};