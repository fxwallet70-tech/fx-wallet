import api from "../api/axios";

export const getCdmSetting = async () => {
  const response = await api.get("/cdm/setting");
  return response.data;
};

export const submitCdmRequest = async (
  planId: string,
  screenshot: File,
  accountDetails: string,
  transactionId: string
) => {
  const formData = new FormData();
  formData.append("screenshot", screenshot);
  formData.append("planId", planId);
  formData.append("accountDetails", accountDetails);
  formData.append("transactionId", transactionId);

  const response = await api.post("/cdm", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const getMyCdmRequests = async () => {
  const response = await api.get("/cdm/my");
  return response.data;
};
