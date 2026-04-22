import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Users, Edit, Trash2, Shield, User, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<{
    id: number;
    name: string | null;
    email: string | null;
    role: "user" | "admin";
  } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Redirect non-admins
  if (currentUser && currentUser.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: users, isLoading } = trpc.users.list.useQuery();
  const utils = trpc.useUtils();

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado com sucesso.");
      utils.users.list.invalidate();
      setEditUser(null);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário excluído.");
      utils.users.list.invalidate();
      setDeleteId(null);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const filtered = users?.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(s) ||
      (u.email || "").toLowerCase().includes(s)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" style={{ color: "var(--segalla-red)" }} />
              Gestão de Usuários
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie os usuários do sistema
            </p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
              {users && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({users.length} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filtered?.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Users className="h-10 w-10 opacity-30" />
                <p className="text-sm">Nenhum usuário encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Usuário</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">E-mail</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Papel</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Criado em</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((u) => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ background: u.role === "admin" ? "var(--segalla-red)" : "var(--segalla-blue)" }}>
                              {(u.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{u.name || "—"}</span>
                            {u.id === currentUser?.id && (
                              <Badge variant="outline" className="text-xs">Você</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {u.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {u.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-800">
                              <Shield className="h-3 w-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                              <User className="h-3 w-3" />
                              Usuário
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditUser({
                                id: u.id,
                                name: u.name,
                                email: u.email,
                                role: u.role,
                              })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              disabled={u.id === currentUser?.id}
                              onClick={() => setDeleteId(u.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit dialog */}
      <Dialog open={editUser !== null} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  value={editUser.name || ""}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={editUser.email || ""}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Papel</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(val) => setEditUser({ ...editUser, role: val as "user" | "admin" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button
              onClick={() => editUser && updateMutation.mutate({
                id: editUser.id,
                name: editUser.name || undefined,
                email: editUser.email || undefined,
                role: editUser.role,
              })}
              disabled={updateMutation.isPending}
              style={{ background: "var(--segalla-red)" }}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
