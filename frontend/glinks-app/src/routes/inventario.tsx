import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { useFetch, useMutation } from "@/hooks/useFetch";
import { useState } from "react";
import { productosApi, type CreateProductInput } from "@/services/api/productos";
import { facturasApi } from "@/services/api/facturas";
import { checkProductInMaintenances } from "@/services/api/mantenimientos";
import type { Product } from "@/models";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import {
  showSuccess, showError, showConfirmDelete, showCannotDelete, showToast,
} from "@/lib/swal";
import { saveOfflineRecord, checkConnection } from "@/services/api/syncService";

const emptyForm: CreateProductInput = {
  name: "",
  type: "Router",
  description: "",
  unit_price: 0,
  billable: true,
};

const productTypes = ["Servicio", "Físico"];

export default function InventarioPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<CreateProductInput>(emptyForm);

  const { data: invoicesPage } = useFetch(() => facturasApi.list(1, 1000), []);
  const invoices = invoicesPage?.data ?? [];

  const {
    data: pageData,
    loading: isLoading,
    refetch,
  } = useFetch(
    () => (search ? productosApi.search(search, 1, 200) : productosApi.list(1, 200)),
    [search]
  );

  const isProductInInvoices = (productId: string): boolean =>
    invoices.some(
      (inv) =>
        inv.physicalProductItems?.some((item) => item.product_id === productId) ||
        inv.serviceProductItems?.some((item) => item.product_id === productId)
    );

  const getInvoiceCountForProduct = (productId: string): number =>
    invoices.filter(
      (inv) =>
        inv.physicalProductItems?.some((item) => item.product_id === productId) ||
        inv.serviceProductItems?.some((item) => item.product_id === productId)
    ).length;

  const createMutation = useMutation(
    async (data: CreateProductInput) => {
      const isOnline = await checkConnection();
      
      if (!isOnline) {
        const tempId = `offline_product_${Date.now()}`;
        await saveOfflineRecord('product', 'CREATE', tempId, data);
        return { id: tempId, ...data } as any;
      }
      
      return productosApi.create(data);
    },
    {
      onSuccess: () => {
        refetch();
        showSuccess("Producto registrado exitosamente", "Producto registrado");
        setOpen(false);
        setForm(emptyForm);
      },
      onError: (err) => showError(err.message, "Error al registrar"),
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: Partial<CreateProductInput> }) => {
      const isOnline = await checkConnection();
      
      if (!isOnline) {
        await saveOfflineRecord('product', 'UPDATE', id, data);
        return { id, ...data } as any;
      }
      
      return productosApi.update(id, data);
    },
    {
      onSuccess: () => {
        refetch();
        showSuccess("Producto actualizado exitosamente", "Producto actualizado");
        setOpen(false);
      },
      onError: (err) => showError(err.message, "Error al actualizar"),
    }
  );

  const deleteMutation = useMutation(
    async (product: Product) => {
      const isOnline = await checkConnection();
      
      if (!isOnline) {
        await saveOfflineRecord('product', 'DELETE', product.id, product);
        return { message: "Producto marcado para eliminación offline" };
      }
      
      if (isProductInInvoices(product.id)) throw new Error("PRODUCT_HAS_INVOICES");
      const inMaintenances = await checkProductInMaintenances(product.id);
      if (inMaintenances) throw new Error("PRODUCT_HAS_MAINTENANCES");
      return productosApi.remove(product.id);
    },
    {
      onSuccess: () => {
        refetch();
        showSuccess("Producto eliminado exitosamente", "Producto eliminado");
      },
      onError: (err, product) => {
        if (err.message === "PRODUCT_HAS_INVOICES") {
          const count = getInvoiceCountForProduct(product?.id || '');
          showCannotDelete(
            product?.name || 'Producto',
            `Este producto aparece en ${count} factura(s).`
          );
        } else if (err.message === "PRODUCT_HAS_MAINTENANCES") {
          showCannotDelete(
            product?.name || 'Producto',
            "Este producto ha sido utilizado en mantenimientos."
          );
        } else {
          showError(err.message, "Error al eliminar");
        }
      },
    }
  );

  const handleDelete = async (product: Product) => {
    const confirmed = await showConfirmDelete(product.name, "producto");
    if (confirmed) deleteMutation.mutate(product);
  };

  const products = (pageData?.data ?? []).filter(
    (p) => filterType === "all" || p.type === filterType
  );

  const totalProducts = pageData?.total ?? 0;
  const allProducts = pageData?.data ?? [];
  const billableCount = allProducts.filter((p) => p.billable === true).length;
  const nonBillableCount = totalProducts - billableCount;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      type: p.type,
      description: p.description || "",
      unit_price: p.unit_price,
      billable: p.billable,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) { showToast("El nombre del producto es requerido", "error"); return; }
    if (form.unit_price < 0) { showToast("El precio no puede ser negativo", "error"); return; }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-muted-foreground text-sm">Gestión de productos y servicios</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo producto
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total productos</div>
          <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-10" /> : totalProducts}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Facturables</div>
          <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-10" /> : billableCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">No facturables</div>
          <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-10" /> : nonBillableCount}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {productTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Facturable</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const hasInvoiceRelation = isProductInInvoices(p.id);
                const invoiceCount = getInvoiceCountForProduct(p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                      {p.description || "—"}
                    </TableCell>
                    <TableCell>₡{p.unit_price.toFixed(2)}</TableCell>
                    <TableCell>
                      {p.billable ? (
                        <Badge variant="default" className="bg-green-600">Sí</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar producto">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(p)}
                          disabled={hasInvoiceRelation}
                          title={hasInvoiceRelation ? `No se puede eliminar: aparece en ${invoiceCount} factura(s)` : "Eliminar producto"}
                        >
                          <Trash2 className={`h-4 w-4 ${hasInvoiceRelation ? "text-gray-400" : "text-destructive"}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay productos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Router MikroTik hAP ac2" />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Especificaciones técnicas, marca, modelo..."
                rows={3}
              />
            </div>
            <div>
              <Label>Precio unitario *</Label>
              <Input
                type="number" step="0.01" min="0"
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="billable"
                checked={form.billable}
                onCheckedChange={(checked) => setForm({ ...form, billable: checked === true })}
              />
              <Label htmlFor="billable" className="cursor-pointer">
                Producto facturable (se puede vender en facturas)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Guardar" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}