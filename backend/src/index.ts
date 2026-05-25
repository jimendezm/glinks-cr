import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import clientesFisicosRoutes from "./routes/clientesFisicos.js";
import clientesJuridicosRoutes from "./routes/clientesJuridicos.js";
import mantenimientosRoutes from "./routes/mantenimientos.js";
import facturacionRoutes from "./routes/facturacion.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

// Más adelante en producción es necesario modificar esta línea para que cors() no permita cualquier
// request de cualquier origen, sino solo las estrictamente necesarias.
app.use(cors());
app.use(express.json());

// Esta es solo para verificar que todo esté funcionando correctamente.
app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

app.use("/api/auth", authRoutes);
app.use("/api/clientes-fisicos", clientesFisicosRoutes);
app.use("/api/clientes-juridicos", clientesJuridicosRoutes);
app.use("/api/mantenimientos", mantenimientosRoutes);
app.use("/api/facturas", facturacionRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[API] Servidor corriendo en el puerto ${PORT}`);
});
