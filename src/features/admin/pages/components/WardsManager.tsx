import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface WardsManagerProps {
  countryCode: string;
}

export function WardsManager({ countryCode }: WardsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingWard, setEditingWard] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", constituencyId: "", population: "" });

  const { data: constituencies } = useQuery({
    queryKey: ["constituencies", countryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("constituencies")
        .select("*, counties!inner(name, country)")
        .eq("counties.country", countryCode)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: wards, isLoading } = useQuery({
    queryKey: ["wards", countryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wards")
        .select("*, constituencies!inner(name, counties!inner(name, country))")
        .eq("constituencies.counties.country", countryCode)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (newWard: { name: string; constituency_id: string; population: number | null }) => {
      const { error } = await supabase.from("wards").insert([newWard] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards", countryCode] });
      toast({ title: "Ward added successfully" });
      setIsAddOpen(false);
      setFormData({ name: "", constituencyId: "", population: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Error adding ward", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("administrative_divisions")
        .update(params.data)
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      toast({ title: "Ward updated successfully" });
      setIsEditOpen(false);
      setEditingWard(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating ward", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wards"] });
      toast({ title: "Ward deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting ward", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    addMutation.mutate({
      name: formData.name,
      constituency_id: formData.constituencyId,
      population: parseInt(formData.population) || null,
    });
  };

  const handleEdit = () => {
    if (!editingWard) return;
    updateMutation.mutate({
      id: editingWard.id,
      data: {
        name: formData.name,
        constituency_id: formData.constituencyId,
        population: parseInt(formData.population) || null,
      },
    });
  };

  const openEditDialog = (ward: any) => {
    setEditingWard(ward);
    setFormData({
      name: ward.name,
      constituencyId: ward.constituency_id,
      population: ward.population?.toString() || "",
    });
    setIsEditOpen(true);
  };

  if (isLoading) return <div>Loading wards...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Total: {wards?.length || 0} wards</p>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Ward
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Ward</DialogTitle>
              <DialogDescription>Enter the details for the new ward</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Ward Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Kitisuru"
                />
              </div>
              <div>
                <Label htmlFor="constituency">Constituency</Label>
                <Select value={formData.constituencyId} onValueChange={(value) => setFormData({ ...formData, constituencyId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select constituency" />
                  </SelectTrigger>
                  <SelectContent>
                    {constituencies?.map((constituency) => (
                      <SelectItem key={constituency.id} value={constituency.id}>
                        {constituency.name} ({constituency.counties?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="population">Population (optional)</Label>
                <Input
                  id="population"
                  type="number"
                  value={formData.population}
                  onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={!formData.name || !formData.constituencyId}>
                Add Ward
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Constituency</TableHead>
              <TableHead>County</TableHead>
              <TableHead>Population</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wards?.map((ward) => (
              <TableRow key={ward.id}>
                <TableCell className="font-medium">{ward.name}</TableCell>
                <TableCell>{ward.constituencies?.name || "N/A"}</TableCell>
                <TableCell>{ward.constituencies?.counties?.name || "N/A"}</TableCell>
                <TableCell>{ward.population?.toLocaleString() || "N/A"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(ward)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(ward.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ward</DialogTitle>
            <DialogDescription>Update the ward details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Ward Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-constituency">Constituency</Label>
              <Select value={formData.constituencyId} onValueChange={(value) => setFormData({ ...formData, constituencyId: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {constituencies?.map((constituency) => (
                    <SelectItem key={constituency.id} value={constituency.id}>
                      {constituency.name} ({constituency.counties?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-population">Population</Label>
              <Input
                id="edit-population"
                type="number"
                value={formData.population}
                onChange={(e) => setFormData({ ...formData, population: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit}>Update Ward</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
