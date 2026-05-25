import { Router } from "express";
import * as controller from "../controllers/facturacionController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Return all invoices.
router.get("/", controller.list);
// Return a specific invoice.
router.get("/:id", controller.getById);
// Creates an invoice to a physical client.
router.post("/fisicos", controller.createPhysical);
// Creates an invoice to a legal client.
router.post("/juridicos", controller.createLegal);

export default router;
