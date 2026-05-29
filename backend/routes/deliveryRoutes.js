import express from "express";
import { getCities, calculateDelivery } from "../controllers/deliveryController.js";

const router = express.Router();

router.get("/cities", getCities);
router.post("/calculate", calculateDelivery);

export default router;
