// backend/utils/statusChecker.ts

import axios from "axios";
import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export async function checkServiceStatus(
  url: string
): Promise<"online" | "offline"> {
  try {
    await axios.head(url, {
      timeout: 5000,
      httpsAgent: agent, // 👈 Use the custom agent here
    });

    return "online";
  } catch (error) {
    // Any error (including certificate errors, timeouts, etc.) is treated as offline
    return "offline";
  }
}
