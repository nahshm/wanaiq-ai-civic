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

interface ConstituenciesManagerProps {
  countryCode: string;
}

export function ConstituenciesManager({ countryCode }: ConstituenciesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingConstituency, setEditingConstituency] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", countyId: "", population: "" });

  const { data: counties } = useQuery({
    queryKey: ["counties", countryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counties")
        .select("*")
        .eq("country", countryCode)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: constituencies, isLoading } = useQuery({
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

  const addMutation = useMutation({
    mutationFn: async (newConstituency: { name: string; county_id: string; population: number | null }) => {
      const { error } = await supabase.from("constituencies").insert([newConstituency] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["constituencies", countryCode] });
      toast({ title: "Constituency added successfully" });
      setIsAddOpen(false);
      setFormData({ name: "", countyId: "", population: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Error adding constituency", description: error.message, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["constituencies"] });
      toast({ title: "Constituency updated successfully" });
      setIsEditOpen(false);
      setEditingConstituency(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating constituency", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("constituencies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["constituencies"] });
      toast({ title: "Constituency deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting constituency", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    addMutation.mutate({
      name: formData.name,
      county_id: formData.countyId,
      population: parseInt(formData.population) || null,
    });
  };

  const handleEdit = () => {
    if (!editingConstituency) return;
    updateMutation.mutate({
      id: editingConstituency.id,
      data: {
        name: formData.name,
        county_id: formData.countyId,
        population: parseInt(formData.population) || null,
      },
    });
  };

  const openEditDialog = (constituency: any) => {
    setEditingConstituency(constituency);
    setFormData({
      name: constituency.name,
      countyId: constituency.county_id,
      population: constituency.population?.toString() || "",
    });
    setIsEditOpen(true);
  };

  if (isLoading) return <div>Loading constituencies...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Total: {constituencies?.length || 0} constituencies</p>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Constituency
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Constituency</DialogTitle>
              <DialogDescription>Enter the details for the new constituency</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Constituency Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Westlands"
                />
              </div>
              <div>
                <Label htmlFor="county">County</Label>
                <Select value={formData.countyId} onValueChange={(value) => setFormData({ ...formData, countyId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {counties?.map((county) => (
                      <SelectItem key={county.id} value={county.id}>
                        {county.name}
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
              <Button onClick={handleAdd} disabled={!formData.name || !formData.countyId}>
                Add Constituency
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
              <TableHead>County</TableHead>
              <TableHead>Population</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {constituencies?.map((constituency) => (
              <TableRow key={constituency.id}>
                <TableCell className="font-medium">{constituency.name}</TableCell>
                <TableCell>{constituency.counties?.name || "N/A"}</TableCell>
                <TableCell>{constituency.population?.toLocaleString() || "N/A"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(constituency)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(constituency.id)}
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
            <DialogTitle>Edit Constituency</DialogTitle>
            <DialogDescription>Update the constituency details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Constituency Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-county">County</Label>
              <Select value={formData.countyId} onValueChange={(value) => setFormData({ ...formData, countyId: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {counties?.map((county) => (
                    <SelectItem key={county.id} value={county.id}>
                      {county.name}
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
            <Button onClick={handleEdit}>Update Constituency</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
