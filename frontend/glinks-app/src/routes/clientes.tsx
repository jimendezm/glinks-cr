import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useFetch, useMutation } from "@/hooks/useFetch";
import { useState } from "react";
import {
  physicalClientsApi,
  legalClientsApi,
  fetchAllClients,
  type CreatePhysicalClientInput,
  type CreateLegalClientInput,
} from "@/services/api/clientes";
import { facturasApi } from "@/services/api/facturas";
import type { UnifiedClient } from "@/models";
import { Plus, Pencil, Trash2, Eye, Search, Loader2 } from "lucide-react";
import { showSuccess, showError, showConfirmDelete, showCannotDelete, showToast } from "@/lib/swal";
import { fetchAllMaintenances } from "@/services/api/mantenimientos";
import { saveOfflineRecord, checkConnection } from "@/services/api/syncService";

interface FormBase {
  address: string;
  primary_phone: string;
  secondary_phone: string;
  email: string;
  exonerated: boolean;
}

interface FormPhysical extends FormBase {
  tipoCliente: "fisico";
  national_id: string;
  name: string;
  last_name_1: string;
  last_name_2: string;
}

interface FormLegal extends FormBase {
  tipoCliente: "juridico";
  legal_id: string;
  name: string;
}

type FormState = FormPhysical | FormLegal;

const emptyBase: FormBase = {
  address: "",
  primary_phone: "",
  secondary_phone: "",
  email: "",
  exonerated: false,
};

const emptyPhysical: FormPhysical = {
  ...emptyBase,
  tipoCliente: "fisico",
  national_id: "",
  name: "",
  last_name_1: "",
  last_name_2: "",
};

const emptyLegal: FormLegal = {
  ...emptyBase,
  tipoCliente: "juridico",
  legal_id: "",
  name: "",
};

function getClientDisplayName(c: UnifiedClient): string {
  if (c.tipo === "fisico") return `${c.name} ${c.last_name_1} ${c.last_name_2}`;
  return c.name;
}

function getClientDisplayDoc(c: UnifiedClient): string {
  if (c.tipo === "fisico") return c.national_id;
  return c.legal_id;
}

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UnifiedClient | null>(null);
  const [form, setForm] = useState<FormState>(emptyPhysical);
  const [view, setView] = useState<UnifiedClient | null>(null);

  const { data: clients = [], loading: isLoading, refetch: refetchClients } = useFetch(
    () => fetchAllClients(),
    []
  );

  const { data: invoicesPage, refetch: refetchInvoices } = useFetch(
    () => facturasApi.list(1, 1000),
    []
  );
  const invoices = invoicesPage?.data ?? [];

  const { data: maintenancesData } = useFetch(
    () => fetchAllMaintenances(1, 1000),
    []
  );
  const maintenances = maintenancesData?.data ?? [];

  const hasInvoices = (client: UnifiedClient): boolean =>
    invoices.some((inv) =>
      client.tipo === "fisico"
        ? inv.physical_client_id === client.id
        : inv.legal_client_id === client.id
    );

  const getInvoiceCount = (client: UnifiedClient): number =>
    invoices.filter((inv) =>
      client.tipo === "fisico"
        ? inv.physical_client_id === client.id
        : inv.legal_client_id === client.id
    ).length;

  const hasMaintenances = (client: UnifiedClient): boolean =>
    maintenances.some((m) =>
      client.tipo === "fisico"
        ? m.physical_client_id === client.id
        : m.legal_client_id === client.id
    );

  const getMaintenanceCount = (client: UnifiedClient): number =>
    maintenances.filter((m) =>
      client.tipo === "fisico"
        ? m.physical_client_id === client.id
        : m.legal_client_id === client.id
    ).length;

  const createMutation = useMutation(
    async (data: FormState) => {
      const isOnline = await checkConnection();
      
      if (data.tipoCliente === "fisico") {
        if (!/^[1-9][0-9]{8}$/.test(data.national_id))
          throw new Error("La cédula debe tener 9 dígitos y no comenzar con 0");
        if (!/^[2-8][0-9]{7}$/.test(data.primary_phone))
          throw new Error("El teléfono debe tener 8 dígitos y comenzar con 2-8");
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
          throw new Error("El correo electrónico no es válido");

        const input: CreatePhysicalClientInput = {
          nationalId: data.national_id,
          name: data.name,
          lastName1: data.last_name_1,
          lastName2: data.last_name_2,
          primaryPhone: data.primary_phone,
          secondaryPhone: data.secondary_phone?.trim() || null,
          email: data.email?.trim() || null,
          address: data.address,
          exonerated: data.exonerated,
        };
        
        if (!isOnline) {
          const tempId = `offline_client_${Date.now()}`;
          await saveOfflineRecord('client', 'CREATE', tempId, {
            ...data,
            tipo: 'fisico',
            offlineId: tempId
          });
          return { id: tempId, ...input } as any;
        }
        
        return physicalClientsApi.create(input);
      } else {
        if (!/^[1-9][0-9]{9}$/.test(data.legal_id))
          throw new Error("La cédula jurídica debe tener 10 dígitos y no comenzar con 0");
        if (!/^[2-8][0-9]{7}$/.test(data.primary_phone))
          throw new Error("El teléfono debe tener 8 dígitos y comenzar con 2-8");
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
          throw new Error("El correo electrónico no es válido");

        const input: CreateLegalClientInput = {
          legalId: data.legal_id,
          name: data.name,
          primaryPhone: data.primary_phone,
          secondaryPhone: data.secondary_phone?.trim() || null,
          email: data.email?.trim() || null,
          address: data.address,
          exonerated: data.exonerated,
        };
        
        if (!isOnline) {
          const tempId = `offline_client_${Date.now()}`;
          await saveOfflineRecord('client', 'CREATE', tempId, {
            ...data,
            tipo: 'juridico',
            offlineId: tempId
          });
          return { id: tempId, ...input } as any;
        }
        
        return legalClientsApi.create(input);
      }
    },
    {
      onSuccess: () => {
        refetchClients();
        setOpen(false);
        setTimeout(() => {
          setForm(emptyPhysical);
          showSuccess("El cliente ha sido registrado exitosamente", "Cliente registrado");
        }, 300);
      },
      onError: (err) => {
        setOpen(false);
        setTimeout(() => showError(err.message, "Error al registrar"), 300);
      },
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: FormState }) => {
      const isOnline = await checkConnection();
      
      if (data.tipoCliente === "fisico") {
        if (data.national_id && !/^[1-9][0-9]{8}$/.test(data.national_id))
          throw new Error("La cédula debe tener 9 dígitos y no comenzar con 0");
        if (data.primary_phone && !/^[2-8][0-9]{7}$/.test(data.primary_phone))
          throw new Error("El teléfono debe tener 8 dígitos y comenzar con 2-8");
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
          throw new Error("El correo electrónico no es válido");

        const input: Partial<CreatePhysicalClientInput> = {
          nationalId: data.national_id,
          name: data.name,
          lastName1: data.last_name_1,
          lastName2: data.last_name_2,
          primaryPhone: data.primary_phone,
          secondaryPhone: data.secondary_phone?.trim() || null,
          email: data.email?.trim() || null,
          address: data.address,
          exonerated: data.exonerated,
        };
        
        if (!isOnline) {
          await saveOfflineRecord('client', 'UPDATE', id, {
            ...data,
            tipo: 'fisico'
          });
          return { id, ...input } as any;
        }
        
        return physicalClientsApi.update(id, input);
      } else {
        if (data.legal_id && !/^[1-9][0-9]{9}$/.test(data.legal_id))
          throw new Error("La cédula jurídica debe tener 10 dígitos y no comenzar con 0");
        if (data.primary_phone && !/^[2-8][0-9]{7}$/.test(data.primary_phone))
          throw new Error("El teléfono debe tener 8 dígitos y comenzar con 2-8");
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
          throw new Error("El correo electrónico no es válido");

        const input: Partial<CreateLegalClientInput> = {
          legalId: data.legal_id,
          name: data.name,
          primaryPhone: data.primary_phone,
          secondaryPhone: data.secondary_phone?.trim() || null,
          email: data.email?.trim() || null,
          address: data.address,
          exonerated: data.exonerated,
        };
        
        if (!isOnline) {
          await saveOfflineRecord('client', 'UPDATE', id, {
            ...data,
            tipo: 'juridico'
          });
          return { id, ...input } as any;
        }
        
        return legalClientsApi.update(id, input);
      }
    },
    {
      onSuccess: () => {
        refetchClients();
        setOpen(false);
        setTimeout(() => showSuccess("Los datos del cliente han sido actualizados", "Cliente actualizado"), 300);
      },
      onError: (err) => {
        setOpen(false);
        setTimeout(() => showError(err.message, "Error al actualizar"), 300);
      },
    }
  );

  const deleteMutation = useMutation(
    async (c: UnifiedClient) => {
      const isOnline = await checkConnection();
      
      if (!isOnline) {
        await saveOfflineRecord('client', 'DELETE', c.id, { tipo: c.tipo });
        return { message: "Cliente marcado para eliminación offline" };
      }
      
      if (c.tipo === "fisico") return physicalClientsApi.remove(c.id);
      return legalClientsApi.remove(c.id);
    },
    {
      onSuccess: () => {
        refetchClients();
        refetchInvoices();
        showSuccess("Cliente eliminado exitosamente", "Cliente eliminado");
      },
      onError: (err, client) => {
        // Asegurar que client existe antes de acceder a sus propiedades
        if (client && typeof client === 'object' && 'tipo' in client) {
          const c = client as UnifiedClient;
          if (err.message.includes("foreign key") || err.message.includes("constraint")) {
            showCannotDelete(
              getClientDisplayName(c),
              `Este cliente tiene ${getInvoiceCount(c)} factura(s) asociada(s).`
            );
          } else {
            showError(err.message, "Error al eliminar");
          }
        } else {
          showError(err.message, "Error al eliminar el cliente");
        }
      },
    }
  );

  const handleDelete = async (client: UnifiedClient) => {
    const invoiceCount = getInvoiceCount(client);
    const maintenanceCount = getMaintenanceCount(client);

    if (invoiceCount > 0 || maintenanceCount > 0) {
      const reasons: string[] = [];
      if (invoiceCount > 0) reasons.push(`${invoiceCount} factura(s)`);
      if (maintenanceCount > 0) reasons.push(`${maintenanceCount} mantenimiento(s)`);
      showCannotDelete(
        getClientDisplayName(client),
        `Este cliente tiene ${reasons.join(" y ")} asociada(s). No puede eliminarse mientras existan registros vinculados.`
      );
      return;
    }

    const confirmed = await showConfirmDelete(getClientDisplayName(client), "cliente");
    if (confirmed) deleteMutation.mutate(client);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPhysical);
    setOpen(true);
  };

  const openEdit = (c: UnifiedClient) => {
    setEditing(c);
    if (c.tipo === "fisico") {
      setForm({
        tipoCliente: "fisico",
        national_id: c.national_id,
        name: c.name,
        last_name_1: c.last_name_1,
        last_name_2: c.last_name_2,
        primary_phone: c.primary_phone,
        secondary_phone: c.secondary_phone ?? "",
        email: c.email ?? "",
        address: c.address,
        exonerated: c.exonerated,
      });
    } else {
      setForm({
        tipoCliente: "juridico",
        legal_id: c.legal_id,
        name: c.name,
        primary_phone: c.primary_phone,
        secondary_phone: c.secondary_phone ?? "",
        email: c.email ?? "",
        address: c.address,
        exonerated: c.exonerated,
      });
    }
    setOpen(true);
  };

  const switchTipo = (t: "fisico" | "juridico") => {
    setForm(t === "fisico" ? emptyPhysical : emptyLegal);
  };

  const setFormField = <K extends keyof FormBase>(key: K, value: FormBase[K]) => {
    setForm({ ...form, [key]: value } as FormState);
  };

  const submit = async () => {
    if (form.tipoCliente === "fisico") {
      if (!form.name || !form.national_id) { showToast("Debe completar el nombre y la cédula", "error"); return; }
      if (!/^[1-9][0-9]{8}$/.test(form.national_id)) { showToast("La cédula debe tener 9 dígitos y no comenzar con 0", "error"); return; }
    } else {
      if (!form.name || !form.legal_id) { showToast("Debe completar el nombre de empresa y la cédula jurídica", "error"); return; }
      if (!/^[1-9][0-9]{9}$/.test(form.legal_id)) { showToast("La cédula jurídica debe tener 10 dígitos y no comenzar con 0", "error"); return; }
    }
    if (!form.primary_phone) { showToast("El teléfono primario es requerido", "error"); return; }
    if (!/^[2-8][0-9]{7}$/.test(form.primary_phone)) { showToast("El teléfono debe tener 8 dígitos y comenzar con 2-8", "error"); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { showToast("Ingrese un correo electrónico válido", "error"); return; }
    if (!form.address) { showToast("La dirección es requerida", "error"); return; }

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filtered = (clients ?? []).filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      getClientDisplayName(c).toLowerCase().includes(term) ||
      getClientDisplayDoc(c).toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gestión de clientes del ISP</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo cliente
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre o cédula"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                  <TableHead className="hidden md:table-cell">Dirección</TableHead>
                  <TableHead>Exonerado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((c) => {
                  const hasInvoiceRelation = hasInvoices(c);
                  const invoiceCount = getInvoiceCount(c);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{getClientDisplayName(c)}</TableCell>
                      <TableCell className="font-mono text-xs">{getClientDisplayDoc(c)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={c.tipo === "fisico" ? "default" : "secondary"}>
                          {c.tipo === "fisico" ? "Física" : "Jurídica"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{c.primary_phone}</TableCell>
                      <TableCell className="hidden md:table-cell truncate max-w-[180px]">{c.address}</TableCell>
                      <TableCell>
                        {c.exonerated ? (
                          <Badge variant="outline" className="text-green-600">Sí</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setView(c)} title="Ver detalles">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Editar cliente">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(c)}
                            disabled={hasInvoiceRelation}
                            title={hasInvoiceRelation ? `No se puede eliminar: tiene ${invoiceCount} factura(s)` : "Eliminar cliente"}
                          >
                            <Trash2 className={`h-4 w-4 ${hasInvoiceRelation ? "text-gray-400" : "text-destructive"}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Sin resultados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground">
                Página {page} de {totalPages} ({filtered.length} clientes)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          </DialogHeader>

          {!editing && (
            <div className="flex gap-2">
              <Button variant={form.tipoCliente === "fisico" ? "default" : "outline"} size="sm" onClick={() => switchTipo("fisico")}>
                Persona física
              </Button>
              <Button variant={form.tipoCliente === "juridico" ? "default" : "outline"} size="sm" onClick={() => switchTipo("juridico")}>
                Persona jurídica
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {form.tipoCliente === "fisico" ? (
              <>
                <div>
                  <Label>Cédula (9 dígitos)</Label>
                  <Input value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} placeholder="Ej: 123456789" maxLength={9} />
                  <p className="text-xs text-muted-foreground mt-1">9 dígitos, no comenzar con 0</p>
                </div>
                <div>
                  <Label>Nombre</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Primer apellido</Label>
                  <Input value={form.last_name_1} onChange={(e) => setForm({ ...form, last_name_1: e.target.value })} />
                </div>
                <div>
                  <Label>Segundo apellido</Label>
                  <Input value={form.last_name_2} onChange={(e) => setForm({ ...form, last_name_2: e.target.value })} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Cédula jurídica (10 dígitos)</Label>
                  <Input value={form.legal_id} onChange={(e) => setForm({ ...form, legal_id: e.target.value })} placeholder="Ej: 3101234567" maxLength={10} />
                  <p className="text-xs text-muted-foreground mt-1">10 dígitos, no comenzar con 0</p>
                </div>
                <div className="sm:col-span-2">
                  <Label>Nombre de empresa</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              </>
            )}

            <div>
              <Label>Teléfono principal (8 dígitos)</Label>
              <Input value={form.primary_phone} onChange={(e) => setFormField("primary_phone", e.target.value)} placeholder="Ej: 88888888" maxLength={8} />
              <p className="text-xs text-muted-foreground mt-1">8 dígitos, comenzar con 2-8</p>
            </div>
            <div>
              <Label>Teléfono secundario</Label>
              <Input value={form.secondary_phone} onChange={(e) => setFormField("secondary_phone", e.target.value)} placeholder="Opcional" maxLength={8} />
            </div>
            <div className="sm:col-span-2">
              <Label>Correo electrónico</Label>
              <Input type="email" value={form.email} onChange={(e) => setFormField("email", e.target.value)} placeholder="cliente@ejemplo.com" />
            </div>
            <div className="sm:col-span-2">
              <Label>Dirección</Label>
              <Input value={form.address} onChange={(e) => setFormField("address", e.target.value)} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <Checkbox id="exonerated" checked={form.exonerated} onCheckedChange={(checked) => setFormField("exonerated", checked === true)} />
              <Label htmlFor="exonerated" className="cursor-pointer">Cliente exonerado de impuestos</Label>
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

      <Dialog open={!!view} onOpenChange={(v) => !v && setView(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{view ? getClientDisplayName(view) : ""}</DialogTitle>
          </DialogHeader>
          {view && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Tipo</span>
                <span>{view.tipo === "fisico" ? "Persona física" : "Persona jurídica"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{view.tipo === "fisico" ? "Cédula" : "Cédula jurídica"}</span>
                <span className="font-mono">{getClientDisplayDoc(view)}</span>
              </div>
              {view.tipo === "fisico" && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Nombre completo</span>
                  <span>{`${view.name} ${view.last_name_1} ${view.last_name_2}`}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Teléfono</span>
                <span>{view.primary_phone}</span>
              </div>
              {view.secondary_phone && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Teléfono 2</span>
                  <span>{view.secondary_phone}</span>
                </div>
              )}
              {view.email && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Correo</span>
                  <span>{view.email}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Dirección</span>
                <span className="text-right">{view.address}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Exonerado</span>
                <span>{view.exonerated ? "Sí" : "No"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Registrado</span>
                <span>{new Date(view.createdAt).toLocaleDateString("es-CR")}</span>
              </div>
              {hasInvoices(view) && (
                <div className="flex justify-between gap-4 mt-2 pt-2 border-t">
                  <span className="text-muted-foreground">Facturas asociadas</span>
                  <span className="text-amber-600 font-medium">{getInvoiceCount(view)} factura(s)</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}