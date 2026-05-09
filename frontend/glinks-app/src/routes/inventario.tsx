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
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { productosApi, type CreateProductoInput } from "@/services/api/productos";
import type { Producto, ProductoTipo, ProductoEstado } from "@/models";
import { Plus, Pencil, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inventario")({
  component: () => (
    <Protected>
      <InventarioPage />
    </Protected>
  ),
});

const emptyForm: CreateProductoInput = {
  nombre: "",
  tipo: "Router",
  serial: "",
  stock: 0,
  precio: 0,
};

function InventarioPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState<CreateProductoInput>(emptyForm);

  const { data: pageData, isLoading } = useQuery({
    queryKey: ["productos", "list"],
    queryFn: () => productosApi.list(1, 200),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductoInput) => productosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success("Producto registrado");
      setOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductoInput> & { estado?: string } }) =>
      productosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success("Producto actualizado");
      setOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const productos = (pageData?.data ?? []).filter((p) => {
    const t = q.toLowerCase();
    const matchQ =
      !t ||
      p.nombre.toLowerCase().includes(t) ||
      p.serial.toLowerCase().includes(t);
    const matchT = filtroTipo === "all" || p.tipo === filtroTipo;
    return matchQ && matchT;
  });

  const total = pageData?.data.length ?? 0;
  const enUso = pageData?.data.filter((p) => p.estado === "en_uso").length ?? 0;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Producto) => {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      tipo: p.tipo,
      serial: p.serial,
      stock: p.stock,
      precio: p.precio,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.nombre) {
      toast.error("Nombre requerido");
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: { ...form, estado: editing.estado } });
    } else {
      createMutation.mutate(form);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-muted-foreground text-sm">Routers y equipos PoE</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-10" /> : total}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">En uso</div>
          <div className="text-2xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-10" /> : enUso}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Disponibles</div>
          <div className="text-2xl font-bold">
            {isLoading ? <Skeleton className="h-8 w-10" /> : total - enUso}
          </div>
        </Card>
      </div>

      {/* TABLE */}
      <Card className="p-4">
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Router">Router</SelectItem>
              <SelectItem value="PoE">PoE</SelectItem>
              <SelectItem value="Antena AP">Antena AP</SelectItem>
              <SelectItem value="Tubo metálico">Tubo metálico</SelectItem>
              <SelectItem value="Cable">Cable</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Serial</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>{p.tipo}</TableCell>
                  <TableCell className="hidden md:table-cell">{p.serial}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>
                    <Badge variant={p.estado === "disponible" ? "default" : "secondary"}>
                      {p.estado === "disponible" ? "Disponible" : "En uso"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {productos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Sin productos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm({ ...form, tipo: v as ProductoTipo })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Router">Router</SelectItem>
                  <SelectItem value="PoE">PoE</SelectItem>
                  <SelectItem value="Antena AP">Antena AP</SelectItem>
                  <SelectItem value="Tubo metálico">Tubo metálico</SelectItem>
                  <SelectItem value="Cable">Cable</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Serial</Label>
              <Input
                value={form.serial}
                onChange={(e) => setForm({ ...form, serial: e.target.value })}
              />
            </div>
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: +e.target.value })}
              />
            </div>
            <div>
              <Label>Precio</Label>
              <Input
                type="number"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: +e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editing ? "Guardar" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
