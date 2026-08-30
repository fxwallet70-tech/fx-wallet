import api from "../api/axios";

export interface AppSettings {
  _id?: string;
  appName: string;
  logo?: string;
  bannerImages?: string[];
  supportEmail: string;
  supportPhone: string;
  whatsapp?: string;
  telegram?: string;
  website?: string;
  privacyPolicy?: string;
  termsConditions?: string;
  aboutUs?: string;
  appVersion?: string;
  supportPublicGroup?: string;
  supportOfficialChannel?: string;
  supportOfficialGmail?: string;
  supportCustomerSupport?: string;
}

export const getSettings = async (): Promise<{
  success: boolean;
  settings?: AppSettings;
}> => {
  const res = await api.get("/settings");
  return res.data;
};
