import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { physicalClientsApi, legalClientsApi } from "@/services/api/clientes";
import { productosApi } from "@/services/api/productos";
import { facturasApi } from "@/services/api/facturas";
import { fetchAllMaintenances } from "@/services/api/mantenimientos";
import { Users, Wrench, Package, Receipt } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <Protected>
      <Dashboard />
    </Protected>
  ),
});

function Dashboard() {
  // Clientes físicos
  const { data: physicalPage, isLoading: loadingPhysical } = useQuery({
    queryKey: ["clientes-fisicos", "count"],
    queryFn: () => physicalClientsApi.list(1, 1),
  });

  // Clientes jurídicos
  const { data: legalPage, isLoading: loadingLegal } = useQuery({
    queryKey: ["clientes-juridicos", "count"],
    queryFn: () => legalClientsApi.list(1, 1),
  });

  // Productos
  const { data: productsPage, isLoading: loadingProducts } = useQuery({
    queryKey: ["productos", "list"],
    queryFn: () => productosApi.list(1, 200),
  });

  // Facturas
  const { data: invoicesPage, isLoading: loadingInvoices } = useQuery({
    queryKey: ["facturas", "list"],
    queryFn: () => facturasApi.list(1, 100),
  });

  // Mantenimientos
  const { data: mantData, isLoading: loadingMant } = useQuery({
    queryKey: ["mantenimientos", "count"],
    queryFn: () => fetchAllMaintenances(1, 1),
  });

  const loading = loadingPhysical || loadingLegal || loadingProducts || loadingInvoices || loadingMant;

  // ✅ VALORES SEGUROS - siempre usar arrays vacíos como fallback
  const physicalTotal = physicalPage?.total ?? 0;
  const legalTotal = legalPage?.total ?? 0;
  const totalClients = physicalTotal + legalTotal;

  const totalMaintenances = mantData?.total ?? 0;

  const productsList = productsPage?.data ?? [];
  const totalProducts = productsList.length;
  const billableProducts = productsList.filter((p) => p.billable === true).length;

  const invoicesList = invoicesPage?.data ?? [];
  // ✅ Calcular total facturado sin usar reduce sobre undefined
  let totalBilled = 0;
  for (let i = 0; i < invoicesList.length; i++) {
    const inv = invoicesList[i];
    // Calcular subtotal de productos físicos
    let subtotal = 0;
    if (inv.physicalProductItems) {
      for (let j = 0; j < inv.physicalProductItems.length; j++) {
        const item = inv.physicalProductItems[j];
        if (item?.product?.unit_price) {
          subtotal += item.product.unit_price * (item.amount ?? 1);
        }
      }
    }
    // Calcular subtotal de servicios
    if (inv.serviceProductItems) {
      for (let j = 0; j < inv.serviceProductItems.length; j++) {
        const item = inv.serviceProductItems[j];
        if (item?.product?.unit_price) {
          subtotal += item.product.unit_price;
        }
      }
    }
    totalBilled += subtotal;
  }

  const stats = [
    {
      label: "Clientes",
      value: totalClients,
      icon: Users,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Mantenimientos",
      value: totalMaintenances,
      icon: Wrench,
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Productos",
      value: loading ? "…" : `${billableProducts} / ${totalProducts}`,
      subtitle: "facturables / total",
      icon: Package,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Total facturado",
      value: loading ? "…" : `₡${totalBilled.toFixed(2)}`,
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
            {s.subtitle && (
              <div className="text-xs text-muted-foreground mt-1">{s.subtitle}</div>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Últimas facturas</h2>
        {loadingInvoices ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : invoicesList.length > 0 ? (
          <div className="space-y-2">
            {invoicesList.slice(0, 5).map((inv) => {
              let clientName = "—";
              if (inv.physicalClient) {
                clientName = `${inv.physicalClient.name} ${inv.physicalClient.last_name_1}`;
              } else if (inv.legalClient) {
                clientName = inv.legalClient.name;
              }
              
              // Calcular total de esta factura
              let subtotal = 0;
              if (inv.physicalProductItems) {
                for (let j = 0; j < inv.physicalProductItems.length; j++) {
                  const item = inv.physicalProductItems[j];
                  if (item?.product?.unit_price) {
                    subtotal += item.product.unit_price * (item.amount ?? 1);
                  }
                }
              }
              if (inv.serviceProductItems) {
                for (let j = 0; j < inv.serviceProductItems.length; j++) {
                  const item = inv.serviceProductItems[j];
                  if (item?.product?.unit_price) {
                    subtotal += item.product.unit_price;
                  }
                }
              }
              
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{new Date(inv.date).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">{clientName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₡{subtotal.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay facturas registradas
          </p>
        )}
      </Card>
    </div>
  );
}