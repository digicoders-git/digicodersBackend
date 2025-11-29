import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const sendSMS = async (mobile, message) => {
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message,
        language: "english",
        flash: 0,
        numbers: mobile,
      },
      {
        headers: {
          authorization: process.env.SMS_API_KEY,
        },
      }
    );

    console.log("✅ SMS sent to:", mobile);
  } catch (err) {
    console.error("❌ SMS sending failed:", err.response?.data || err.message);
  }
};
