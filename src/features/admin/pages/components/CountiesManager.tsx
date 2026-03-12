import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface CountiesManagerProps {
  countryCode: string;
}

export function CountiesManager({ countryCode }: CountiesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCounty, setEditingCounty] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", population: "" });

  const { data: counties, isLoading } = useQuery({
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

  const addMutation = useMutation({
    mutationFn: async (newCounty: { name: string; population: number }) => {
      const { error } = await supabase.from("counties").insert([{ ...newCounty, country: countryCode }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counties", countryCode] });
      toast({ title: "County added successfully" });
      setIsAddOpen(false);
      setFormData({ name: "", population: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error adding county", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("counties").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counties"] });
      toast({ title: "County updated successfully" });
      setIsEditOpen(false);
      setEditingCounty(null);
    },
    onError: (error: any) => {
      toast({ title: "Error updating county", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("counties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counties"] });
      toast({ title: "County deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting county", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    addMutation.mutate({
      name: formData.name,
      population: parseInt(formData.population) || 0,
    });
  };

  const handleEdit = () => {
    if (!editingCounty) return;
    updateMutation.mutate({
      id: editingCounty.id,
      data: {
        name: formData.name,
        population: parseInt(formData.population) || 0,
      },
    });
  };

  const openEditDialog = (county: any) => {
    setEditingCounty(county);
    setFormData({ name: county.name, population: county.population?.toString() || "" });
    setIsEditOpen(true);
  };

  if (isLoading) return <div>Loading counties...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Total: {counties?.length || 0} counties</p>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add County
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New County</DialogTitle>
              <DialogDescription>Enter the details for the new county</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">County Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Nairobi"
                />
              </div>
              <div>
                <Label htmlFor="population">Population</Label>
                <Input
                  id="population"
                  type="number"
                  value={formData.population}
                  onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                  placeholder="e.g., 4397073"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={!formData.name}>Add County</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Population</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {counties?.map((county) => (
              <TableRow key={county.id}>
                <TableCell className="font-medium">{county.name}</TableCell>
                <TableCell>{county.population?.toLocaleString() || "N/A"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(county)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(county.id)}
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
            <DialogTitle>Edit County</DialogTitle>
            <DialogDescription>Update the county details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">County Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
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
            <Button onClick={handleEdit}>Update County</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
