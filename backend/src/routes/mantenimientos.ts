import { Router } from "express";
import * as controller from "../controllers/mantenimientosController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Return all maintenances to a physical client.
router.get("/fisicos", controller.listPhysical);
// Creates a maintenance to a physical client.
router.post("/fisicos", controller.createPhysical);
// Return all maintenances to a legal client.
router.get("/juridicos", controller.listLegal);
// Creates a maintenance to a legal client.
router.post("/juridicos", controller.createLegal);

export default router;
