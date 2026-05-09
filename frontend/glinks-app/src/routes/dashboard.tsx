import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { clientesFisicosApi, clientesJuridicosApi } from "@/services/api/clientes";
import { fetchTodosMantenimientos } from "@/services/api/mantenimientos";
import { productosApi } from "@/services/api/productos";
import { facturasApi } from "@/services/api/facturas";
import { Users, Wrench, Package, Receipt } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <Protected>
      <Dashboard />
    </Protected>
  ),
});

function Dashboard() {
  const { data: resumen, isLoading: loadingResumen } = useQuery({
    queryKey: ["productos", "resumen"],
    queryFn: () => productosApi.resumen(),
  });

  const { data: facturasPage, isLoading: loadingFacturas } = useQuery({
    queryKey: ["facturas", { page: 1, limit: 5 }],
    queryFn: () => facturasApi.list(1, 5),
  });

  const { data: totalFisicos } = useQuery({
    queryKey: ["clientes-fisicos", "count"],
    queryFn: () => clientesFisicosApi.list(1, 1),
  });

  const { data: totalJuridicos } = useQuery({
    queryKey: ["clientes-juridicos", "count"],
    queryFn: () => clientesJuridicosApi.list(1, 1),
  });

  const { data: mantPage } = useQuery({
    queryKey: ["mantenimientos", "count"],
    queryFn: () => fetchTodosMantenimientos(undefined, 1, 1),
  });

  const loading =
    loadingResumen || loadingFacturas || !totalFisicos || !totalJuridicos || !mantPage;
  const totalClientes = (totalFisicos?.total ?? 0) + (totalJuridicos?.total ?? 0);
  const totalMant = mantPage?.total ?? 0;

  const stats = [
    { label: "Clientes", value: totalClientes, icon: Users, color: "bg-blue-500/10 text-blue-600" },
    { label: "Mantenimientos", value: totalMant, icon: Wrench, color: "bg-amber-500/10 text-amber-600" },
    {
      label: "Productos en uso",
      value: loadingResumen ? "…" : `${resumen?.routers.enUso ?? 0} / ${(resumen?.routers.total ?? 0) + (resumen?.poes.total ?? 0)}`,
      icon: Package,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Facturado (activo)",
      value: loadingFacturas
        ? "…"
        : `₡${facturasPage?.data.filter((f) => f.estado === "activa").reduce((s, f) => s + f.total, 0).toFixed(2) ?? "0.00"}`,
      icon: Receipt,
      color: "bg-purple-500/10 text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div
              className={`h-10 w-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-7 w-16" /> : s.value}
            </div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Últimas facturas</h2>
        {loadingFacturas ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : facturasPage && facturasPage.data.length > 0 ? (
          <div className="space-y-2">
            {facturasPage.data.slice(0, 5).map((f) => {
              const clienteNombre =
                f.clienteFisico?.nombre ??
                f.clienteJuridico?.nombreEmpresa ??
                "—";
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{f.numero}</div>
                    <div className="text-xs text-muted-foreground">
                      {clienteNombre}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₡{f.total.toFixed(2)}</div>
                    <div
                      className={`text-xs ${f.estado === "anulada" ? "text-destructive" : "text-emerald-600"}`}
                    >
                      {f.estado}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin facturas</p>
        )}
      </Card>
    </div>
  );
}
