import { message } from "antd";
import { api } from "./api";

export const openUrl = async (url: string): Promise<void> => {
  try {
    await api.window.openUrl(url);
  } catch (error) {
    message.error(error instanceof Error ? error.message : "打开链接失败");
  }
};
