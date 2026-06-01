import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchAllClients } from "@/services/api/clientes";
import { productosApi } from "@/services/api/productos";
import { facturasApi } from "@/services/api/facturas";
import type { Invoice, Product } from "@/models";
import { Plus, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addDays } from "date-fns";

export const Route = createFileRoute("/facturacion")({
  component: () => (
    <Protected>
      <FacturacionPage />
    </Protected>
  ),
});

interface PhysicalCartItem {
  productId: string;
  amount: number;
  product: Product;
}

interface ServiceCartItem {
  productId: string;
  startDate: Date;
  endDate: Date;
  product: Product;
}

function FacturacionPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Invoice | null>(null);

  const [clientId, setClientId] = useState("");
  const [physicalItems, setPhysicalItems] = useState<PhysicalCartItem[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceCartItem[]>([]);
  const [selectedPhysicalProductId, setSelectedPhysicalProductId] = useState("");
  const [physicalAmount, setPhysicalAmount] = useState(1);
  const [selectedServiceProductId, setSelectedServiceProductId] = useState("");
  const [serviceStartDate, setServiceStartDate] = useState(new Date());
  const [serviceEndDate, setServiceEndDate] = useState(addDays(new Date(), 30));

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["clientes", "todos"],
    queryFn: fetchAllClients,
    staleTime: 60_000,
  });

  const { data: productsPage, isLoading: loadingProducts } = useQuery({
    queryKey: ["productos", "list"],
    queryFn: () => productosApi.list(1, 200),
  });

  const { data: invoicesPage, isLoading: loadingInvoices } = useQuery({
    queryKey: ["facturas", "list"],
    queryFn: () => facturasApi.list(1, 200),
  });

  const products = productsPage?.data ?? [];
  const invoices = invoicesPage?.data ?? [];

  const physicalProducts = products.filter((p) => p.billable === true);
  const serviceProducts = products.filter((p) => p.billable === false);

  const selectedClient = clients.find((c) => c.id === clientId);
  const isExonerated = selectedClient?.exonerated ?? false;

  const calculateSubtotal = () => {
    let subtotal = 0;
    for (let i = 0; i < physicalItems.length; i++) {
      const item = physicalItems[i];
      subtotal += (item.product?.unit_price ?? 0) * (item.amount ?? 1);
    }
    for (let i = 0; i < serviceItems.length; i++) {
      const item = serviceItems[i];
      subtotal += item.product?.unit_price ?? 0;
    }
    return subtotal;
  };

  const subtotal = calculateSubtotal();
  const taxRate = isExonerated ? 0 : 0.13;
  const taxes = subtotal * taxRate;
  const total = subtotal + taxes;

  const resetForm = () => {
    setClientId("");
    setPhysicalItems([]);
    setServiceItems([]);
    setSelectedPhysicalProductId("");
    setPhysicalAmount(1);
    setSelectedServiceProductId("");
    setServiceStartDate(new Date());
    setServiceEndDate(addDays(new Date(), 30));
  };

  const addPhysicalItem = () => {
    if (!selectedPhysicalProductId) {
      toast.error("Seleccione un producto");
      return;
    }
    if (physicalAmount < 1) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    const product = physicalProducts.find((p) => p.id === selectedPhysicalProductId);
    if (!product) return;

    const existingIndex = physicalItems.findIndex((i) => i.productId === selectedPhysicalProductId);
    if (existingIndex >= 0) {
      const newItems = [...physicalItems];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        amount: newItems[existingIndex].amount + physicalAmount,
      };
      setPhysicalItems(newItems);
    } else {
      setPhysicalItems([...physicalItems, { productId: selectedPhysicalProductId, amount: physicalAmount, product }]);
    }

    setSelectedPhysicalProductId("");
    setPhysicalAmount(1);
  };

  const removePhysicalItem = (index: number) => {
    setPhysicalItems(physicalItems.filter((_, i) => i !== index));
  };

  const addServiceItem = () => {
    if (!selectedServiceProductId) {
      toast.error("Seleccione un servicio");
      return;
    }

    const product = serviceProducts.find((p) => p.id === selectedServiceProductId);
    if (!product) return;

    const existing = serviceItems.find((i) => i.productId === selectedServiceProductId);
    if (existing) {
      toast.error("Este servicio ya está agregado");
      return;
    }

    setServiceItems([
      ...serviceItems,
      {
        productId: selectedServiceProductId,
        startDate: serviceStartDate,
        endDate: serviceEndDate,
        product,
      },
    ]);

    setSelectedServiceProductId("");
  };

  const removeServiceItem = (index: number) => {
    setServiceItems(serviceItems.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient) throw new Error("Seleccione un cliente");
      if (physicalItems.length === 0 && serviceItems.length === 0) {
        throw new Error("Agregue al menos un producto o servicio");
      }

      const physicalProductItems = physicalItems.map((item) => ({
        productId: item.productId,
        amount: item.amount,
      }));

      const serviceProductItems = serviceItems.map((item) => ({
        productId: item.productId,
        startDate: item.startDate,
        endDate: item.endDate,
      }));

      if (selectedClient.tipo === "fisico") {
        return facturasApi.createPhysical({
          physicalClientId: clientId,
          physicalProductItems,
          serviceProductItems,
        });
      } else {
        return facturasApi.createLegal({
          legalClientId: clientId,
          physicalProductItems,
          serviceProductItems,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast.success("Factura creada exitosamente");
      setOpen(false);
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const getClientName = (invoice: Invoice) => {
    if (invoice.physicalClient) {
      return `${invoice.physicalClient.name} ${invoice.physicalClient.last_name_1}`;
    }
    if (invoice.legalClient) {
      return invoice.legalClient.name;
    }
    return "—";
  };

  const getInvoiceTotal = (invoice: Invoice) => {
    let total = 0;
    if (invoice.physicalProductItems) {
      for (let i = 0; i < invoice.physicalProductItems.length; i++) {
        const item = invoice.physicalProductItems[i];
        if (item?.product?.unit_price) {
          total += item.product.unit_price * (item.amount ?? 1);
        }
      }
    }
    if (invoice.serviceProductItems) {
      for (let i = 0; i < invoice.serviceProductItems.length; i++) {
        const item = invoice.serviceProductItems[i];
        if (item?.product?.unit_price) {
          total += item.product.unit_price;
        }
      }
    }
    return total;
  };

  const submit = () => {
    if (!clientId) {
      toast.error("Seleccione un cliente");
      return;
    }
    if (physicalItems.length === 0 && serviceItems.length === 0) {
      toast.error("Agregue al menos un producto o servicio");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Facturación</h1>
          <p className="text-muted-foreground text-sm">Gestión de facturas de clientes</p>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva factura
        </Button>
      </div>

      <Card className="p-4">
        {loadingInvoices ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{getClientName(inv)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={inv.physicalClient ? "default" : "secondary"}>
                      {inv.physicalClient ? "Física" : "Jurídica"}
                    </Badge>
                  </TableCell>
                  <TableCell>₡{getInvoiceTotal(inv).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setView(inv)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Sin facturas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* NEW INVOICE DIALOG */}
      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.tipo === "fisico"
                        ? `${c.name} ${c.last_name_1}`
                        : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClient?.exonerated && (
                <p className="text-xs text-green-600 mt-1">Cliente exonerado de impuestos</p>
              )}
            </div>

            {/* Productos Físicos */}
            <div className="border rounded-md p-3 space-y-3">
              <h4 className="font-medium">Productos físicos</h4>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <Label>Producto</Label>
                  <Select value={selectedPhysicalProductId} onValueChange={setSelectedPhysicalProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      {physicalProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - ₡{p.unit_price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={physicalAmount}
                    onChange={(e) => setPhysicalAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div className="col-span-2">
                  <Button className="w-full" onClick={addPhysicalItem} type="button">
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                {physicalItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                    <span>{item.product.name} x{item.amount}</span>
                    <div className="flex items-center gap-2">
                      <span>₡{((item.product?.unit_price ?? 0) * item.amount).toFixed(2)}</span>
                      <Button variant="ghost" size="sm" onClick={() => removePhysicalItem(idx)} type="button">
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
                {physicalItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No hay productos agregados</p>
                )}
              </div>
            </div>

            {/* Servicios */}
            <div className="border rounded-md p-3 space-y-3">
              <h4 className="font-medium">Servicios</h4>
              <div>
                <Label>Servicio</Label>
                <Select value={selectedServiceProductId} onValueChange={setSelectedServiceProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - ₡{p.unit_price}/mes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Fecha inicio</Label>
                  <Input
                    type="date"
                    value={serviceStartDate.toISOString().split("T")[0]}
                    onChange={(e) => setServiceStartDate(new Date(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Fecha fin</Label>
                  <Input
                    type="date"
                    value={serviceEndDate.toISOString().split("T")[0]}
                    onChange={(e) => setServiceEndDate(new Date(e.target.value))}
                  />
                </div>
              </div>
              <Button onClick={addServiceItem} disabled={!selectedServiceProductId} type="button">
                Agregar servicio
              </Button>

              <div className="space-y-1">
                {serviceItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                    <div>
                      <div>{item.product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.startDate.toLocaleDateString()} - {item.endDate.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>₡{(item.product?.unit_price ?? 0).toFixed(2)}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeServiceItem(idx)} type="button">
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
                {serviceItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No hay servicios agregados</p>
                )}
              </div>
            </div>

            {/* Totales */}
            <div className="space-y-1 text-sm border-t pt-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₡{subtotal.toFixed(2)}</span>
              </div>
              {!isExonerated && (
                <div className="flex justify-between text-muted-foreground">
                  <span>IVA (13%)</span>
                  <span>₡{taxes.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span>₡{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={createMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW INVOICE DIALOG */}
      <Dialog open={!!view} onOpenChange={(v) => !v && setView(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Factura</DialogTitle>
          </DialogHeader>
          {view && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Fecha:</span>
                  <div>{new Date(view.date).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <div>{getClientName(view)}</div>
                </div>
              </div>

              {(view.physicalProductItems ?? []).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Productos</h4>
                  <div className="space-y-1">
                    {(view.physicalProductItems ?? []).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product?.name ?? item.product_id} x{item.amount}</span>
                        <span>₡{((item.product?.unit_price ?? 0) * (item.amount ?? 1)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(view.serviceProductItems ?? []).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Servicios</h4>
                  <div className="space-y-2">
                    {(view.serviceProductItems ?? []).map((item) => (
                      <div key={item.id} className="text-sm">
                        <div className="flex justify-between">
                          <span>{item.product?.name ?? item.product_id}</span>
                          <span>₡{(item.product?.unit_price ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Período: {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-2">
                {(() => {
                  let total = 0;
                  for (const item of view.physicalProductItems ?? []) {
                    total += (item.product?.unit_price ?? 0) * (item.amount ?? 1);
                  }
                  for (const item of view.serviceProductItems ?? []) {
                    total += item.product?.unit_price ?? 0;
                  }
                  const client = view.physicalClient ?? view.legalClient;
                  const isExoneratedView = client?.exonerated ?? false;
                  const taxesView = isExoneratedView ? 0 : total * 0.13;
                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>₡{total.toFixed(2)}</span>
                      </div>
                      {!isExoneratedView && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>IVA (13%)</span>
                          <span>₡{taxesView.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold mt-1">
                        <span>Total</span>
                        <span>₡{(total + taxesView).toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}