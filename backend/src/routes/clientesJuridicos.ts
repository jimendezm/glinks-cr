import { Router } from "express";
import * as controller from "../controllers/clientesJuridicosController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Returns all legal clients.
router.get("/", controller.list);
// Returns a specific client based on search criteria.
router.get("/search", controller.search);
// Returns a specific client.
router.get("/:id", controller.getById);
// Creates a new legal client.
router.post("/", controller.create);
// Updates a client.
router.put("/:id", controller.update);
// Deletes a client.
router.delete("/:id", controller.remove);

export default router;
