import { Router } from "express";
import * as controller from "../controllers/clientesFisicosController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

// Returns all physical clients.
router.get("/", controller.list);
// Returns a specific client based on search criteria.
router.get("/search", controller.search);
// Returns a specific client.
router.get("/:id", controller.getById);
// Creates a new physical client.
router.post("/", controller.create);
// Updates a client.
router.put("/:id", controller.update);
// Deletes a client.
router.delete("/:id", controller.remove);

export default router;
