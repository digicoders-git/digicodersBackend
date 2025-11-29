import express from "express";
import { getAll } from "../controllers/countContrallers.js";
import { auth } from '../middleware/auth.js';
const route=express.Router()
route.use(auth);

route.get('/',getAll)
export default route