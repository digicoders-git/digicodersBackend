import Registration from "../models/regsitration.js";
import { sendEmail } from "../utils/sendEmail.js";

export const sendEmails = async (req, res) => {
  try {
    const { studentId, type, message } = req.body;
    const student = await Registration.findById(studentId);
    if (type === "email") await sendEmail(student.email, message);
    if (type === "sms") await sendEmail(student.email, message);
    if (type === "whatsapp") await sendEmail(student.email, message);
    res.status(200).json({ message: "message send successfull" ,success:true});
  } catch (error) {
    return res.status(500).json({ message: "internal server error" });
  }
};
