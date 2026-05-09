import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchTodosClientes } from "@/services/api/clientes";
import {
  mantenimientosApi,
  fetchTodosMantenimientos,
  type CreateMantenimientoInput,
} from "@/services/api/mantenimientos";
import type { ClienteUnificado } from "@/models";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/mantenimiento")({
  component: () => (
    <Protected>
      <MantenimientoPage />
    </Protected>
  ),
});

function MantenimientoPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState<string>("all");
  const [form, setForm] = useState<CreateMantenimientoInput>({
    descripcion: "",
    clienteFisicoId: undefined,
    clienteJuridicoId: undefined,
  });

  // Cargar clientes para el selector y filtros
  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ["clientes", "todos"],
    queryFn: fetchTodosClientes,
  });

  // Cargar mantenimientos unificados
  const { data: mantData, isLoading: loadingMant } = useQuery({
    queryKey: ["mantenimientos", "todos"],
    queryFn: () => fetchTodosMantenimientos(undefined, 1, 200),
  });

  const mantList = mantData?.data ?? [];
  const filtered = mantList.filter(
    (m) => filtro === "all" || m.clienteFisicoId === filtro || m.clienteJuridicoId === filtro,
  );

  // Helper para obtener nombre de cliente desde su ID
  const clienteNombre = (m: (typeof mantList)[number]) => {
    const id = m.clienteFisicoId ?? m.clienteJuridicoId;
    return clientes.find((c) => c.id === id);
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateMantenimientoInput) => {
      if (data.clienteFisicoId) {
        return mantenimientosApi.createFisico(data);
      }
      if (data.clienteJuridicoId) {
        return mantenimientosApi.createJuridico(data);
      }
      throw new Error("Debe seleccionar un cliente");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mantenimientos"] });
      toast.success("Mantenimiento registrado");
      setOpen(false);
      setForm({ descripcion: "", clienteFisicoId: undefined, clienteJuridicoId: undefined });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submit = () => {
    if (!form.clienteFisicoId && !form.clienteJuridicoId) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (!form.descripcion.trim()) {
      toast.error("La descripción es requerida");
      return;
    }
    createMutation.mutate(form);
  };

  const handleClienteChange = (clienteId: string) => {
    const c = clientes.find((x) => x.id === clienteId);
    if (!c) return;
    if (c.tipo === "fisico") {
      setForm({ descripcion: "", clienteFisicoId: c.id, clienteJuridicoId: undefined });
    } else {
      setForm({ descripcion: "", clienteFisicoId: undefined, clienteJuridicoId: c.id });
    }
  };

  const loading = loadingMant || loadingClientes;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mantenimiento</h1>
          <p className="text-muted-foreground text-sm">Registro de servicios técnicos</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={loadingClientes}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo
        </Button>
      </div>

      <Card className="p-4">
        <div className="mb-4 max-w-sm">
          <Label className="mb-1.5 block">Filtrar por cliente</Label>
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.tipo === "fisico"
                    ? `${c.nombre} ${c.apellido1}`
                    : c.nombreEmpresa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((m) => {
              const c = clienteNombre(m);
              return (
                <div
                  key={m.id}
                  className="p-3 border rounded-md flex flex-wrap justify-between gap-2"
                >
                  <div>
                    <div className="font-medium">
                      {c
                        ? c.tipo === "fisico"
                          ? `${c.nombre} ${c.apellido1}`
                          : c.nombreEmpresa
                        : "—"}
                    </div>
                    <div className="text-sm text-muted-foreground">{m.descripcion}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{new Date(m.fecha).toLocaleString()}</div>
                    <div>Por: {m.responsable?.name ?? "—"}</div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">
                Sin registros
              </p>
            )}
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo mantenimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente</Label>
              <Select
                value={form.clienteFisicoId ?? form.clienteJuridicoId ?? ""}
                onValueChange={handleClienteChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.tipo === "fisico"
                        ? `${c.nombre} ${c.apellido1} (Física)`
                        : `${c.nombreEmpresa} (Jurídica)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Detalle del trabajo realizado"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              El responsable se asigna automáticamente según la sesión.
            </p>
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
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
