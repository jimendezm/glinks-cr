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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { fetchTodosClientes } from "@/services/api/clientes";
import { productosApi } from "@/services/api/productos";
import { facturasApi } from "@/services/api/facturas";
import type { Factura, FacturaItem } from "@/models";
import { Plus, Eye, Ban, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/facturacion")({
  component: () => (
    <Protected>
      <FacturacionPage />
    </Protected>
  ),
});

const TAX = 0.13;

function FacturacionPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Factura | null>(null);
  const [clienteId, setClienteId] = useState("");
  const [items, setItems] = useState<FacturaItem[]>([]);
  const [productoSel, setProductoSel] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ["clientes", "todos"],
    queryFn: fetchTodosClientes,
    staleTime: 60_000,
  });

  const { data: prodPage, isLoading: loadingProductos } = useQuery({
    queryKey: ["productos", "list"],
    queryFn: () => productosApi.list(1, 200),
  });

  const {
    data: facturasPage,
    isLoading: loadingFacturas,
  } = useQuery({
    queryKey: ["facturas", "list"],
    queryFn: () => facturasApi.list(1, 200),
  });

  const productos = prodPage?.data ?? [];
  const facturas = facturasPage?.data ?? [];

  const selectedCliente = clientes.find((c) => c.id === clienteId);

  const subtotal = items.reduce((s, i) => s + i.cantidad * i.precio, 0);
  const impuestos = subtotal * TAX;
  const total = subtotal + impuestos;

  const reset = () => {
    setClienteId("");
    setItems([]);
    setProductoSel("");
    setCantidad(1);
  };

  const addItem = () => {
    const p = productos.find((x) => x.id === productoSel);
    if (!p) return;
    setItems([
      ...items,
      { productoId: p.id, nombre: p.nombre, cantidad, precio: p.precio },
    ]);
    setProductoSel("");
    setCantidad(1);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCliente) throw new Error("Selecciona un cliente");
      const input = { items, clienteFisicoId: undefined as string | undefined, clienteJuridicoId: undefined as string | undefined };
      if (selectedCliente.tipo === "fisico") {
        input.clienteFisicoId = clienteId;
      } else {
        input.clienteJuridicoId = clienteId;
      }
      return selectedCliente.tipo === "fisico"
        ? facturasApi.createFisico(input)
        : facturasApi.createJuridico(input);
    },
    onSuccess: (factura) => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast.success(`Factura ${factura.numero} creada`);
      setOpen(false);
      reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const anularMutation = useMutation({
    mutationFn: (id: string) => facturasApi.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast.success("Factura anulada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submit = () => {
    if (!clienteId) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (items.length === 0) {
      toast.error("Añade al menos un producto");
      return;
    }
    createMutation.mutate();
  };

  const displayNombre = (c: (typeof clientes)[number] | undefined) => {
    if (!c) return "—";
    return c.tipo === "fisico" ? `${c.nombre} ${c.apellido1}` : c.nombreEmpresa;
  };

  const clienteDeFactura = (f: Factura) => {
    if (f.clienteFisico) return f.clienteFisico.nombre;
    if (f.clienteJuridico) return f.clienteJuridico.nombreEmpresa;
    // Fallback: buscar en la lista cargada
    const id = f.clienteFisicoId ?? f.clienteJuridicoId;
    if (!id) return "—";
    const c = clientes.find((x) => x.id === id);
    return displayNombre(c);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Facturación</h1>
          <p className="text-muted-foreground text-sm">Gestión de facturas</p>
        </div>
        <Button
          onClick={() => {
            reset();
            setOpen(true);
          }}
          disabled={loadingClientes || loadingProductos}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva factura
        </Button>
      </div>

      <Card className="p-4">
        {loadingFacturas ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.numero}</TableCell>
                  <TableCell>{clienteDeFactura(f)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(f.fecha).toLocaleDateString()}
                  </TableCell>
                  <TableCell>₡{f.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={f.estado === "activa" ? "default" : "destructive"}>
                      {f.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setView(f)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {f.estado === "activa" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Ban className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Anular factura {f.numero}?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción marcará la factura como anulada.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => anularMutation.mutate(f.id)}
                              >
                                Anular
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {facturas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Sin facturas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* NEW INVOICE DIALOG */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {displayNombre(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-md p-3 space-y-3">
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-7">
                  <Label>Producto</Label>
                  <Select value={productoSel} onValueChange={setProductoSel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} (₡{p.precio})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={cantidad}
                    onChange={(e) => setCantidad(+e.target.value || 1)}
                  />
                </div>
                <div className="col-span-2">
                  <Button
                    className="w-full"
                    onClick={addItem}
                    disabled={!productoSel}
                  >
                    Añadir
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                  >
                    <span>
                      {it.nombre} x{it.cantidad}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>₡{(it.cantidad * it.precio).toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Sin productos añadidos
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₡{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IVA (13%)</span>
                <span>₡{impuestos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>Total</span>
                <span>₡{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={submit} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirmar factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW INVOICE DIALOG */}
      <Dialog open={!!view} onOpenChange={(v) => !v && setView(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{view?.numero}</DialogTitle>
          </DialogHeader>
          {view && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span>{clienteDeFactura(view)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha</span>
                <span>{new Date(view.fecha).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <Badge
                  variant={view.estado === "activa" ? "default" : "destructive"}
                >
                  {view.estado}
                </Badge>
              </div>
              <div className="border-t pt-2 mt-2">
                {view.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>
                      {i.nombre} x{i.cantidad}
                    </span>
                    <span>₡{(i.cantidad * i.precio).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₡{view.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>IVA</span>
                  <span>₡{view.impuestos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₡{view.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
