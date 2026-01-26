import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, TrendingUp } from "lucide-react";

interface ImpactMetric {
  id: string;
  metric_name: string;
  metric_value: string;
  unit: string;
  notes: string | null;
  recorded_at: string;
  batch_id: string | null;
  traceability_link: string | null;
  facility_location: string | null;
  category: string | null;
}

const EMPTY_METRIC: Omit<ImpactMetric, "id" | "recorded_at"> = {
  metric_name: "",
  metric_value: "",
  unit: "kg",
  notes: null,
  batch_id: null,
  traceability_link: null,
  facility_location: null,
  category: null,
};

export function ImpactMetricsManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<ImpactMetric | null>(null);
  const [formData, setFormData] = useState<Omit<ImpactMetric, "id" | "recorded_at">>(EMPTY_METRIC);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["impact-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("impact_metrics")
        .select("*")
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return data as ImpactMetric[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<ImpactMetric, "id" | "recorded_at">) => {
      const { error } = await supabase.from("impact_metrics").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["impact-metrics"] });
      toast.success("Metric created successfully");
      resetForm();
    },
    onError: (error) => toast.error("Failed to create: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<ImpactMetric, "id" | "recorded_at"> }) => {
      const { error } = await supabase.from("impact_metrics").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["impact-metrics"] });
      toast.success("Metric updated successfully");
      resetForm();
    },
    onError: (error) => toast.error("Failed to update: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("impact_metrics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["impact-metrics"] });
      toast.success("Metric deleted successfully");
    },
    onError: (error) => toast.error("Failed to delete: " + error.message),
  });

  const resetForm = () => {
    setFormData(EMPTY_METRIC);
    setEditingMetric(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (metric: ImpactMetric) => {
    setEditingMetric(metric);
    setFormData({
      metric_name: metric.metric_name,
      metric_value: metric.metric_value,
      unit: metric.unit,
      notes: metric.notes,
      batch_id: metric.batch_id,
      traceability_link: metric.traceability_link,
      facility_location: metric.facility_location,
      category: metric.category,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.metric_name || !formData.metric_value) {
      toast.error("Name and value are required");
      return;
    }
    if (editingMetric) {
      updateMutation.mutate({ id: editingMetric.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Impact Metrics
          </CardTitle>
          <CardDescription>Manage environmental impact data</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Metric
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingMetric ? "Edit Metric" : "Add New Metric"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Metric Name *</Label>
                  <Input
                    value={formData.metric_name}
                    onChange={(e) => setFormData({ ...formData, metric_name: e.target.value })}
                    placeholder="e.g. Cotton Processing"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={formData.category || ""}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Processing"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Value *</Label>
                  <Input
                    type="number"
                    value={formData.metric_value}
                    onChange={(e) => setFormData({ ...formData, metric_value: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="kg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Facility Location</Label>
                <Input
                  value={formData.facility_location || ""}
                  onChange={(e) => setFormData({ ...formData, facility_location: e.target.value })}
                  placeholder="e.g. Nairobi, Kenya"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Batch ID</Label>
                  <Input
                    value={formData.batch_id || ""}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    placeholder="UK-KEN-044"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Traceability Link</Label>
                  <Input
                    value={formData.traceability_link || ""}
                    onChange={(e) => setFormData({ ...formData, traceability_link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingMetric ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {metrics && metrics.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((metric) => (
                <TableRow key={metric.id}>
                  <TableCell className="font-medium">{metric.metric_name}</TableCell>
                  <TableCell>{metric.metric_value} {metric.unit}</TableCell>
                  <TableCell>{metric.category || "-"}</TableCell>
                  <TableCell>{metric.facility_location || "-"}</TableCell>
                  <TableCell>{metric.batch_id || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(metric)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(metric.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">No metrics yet. Add your first one!</p>
        )}
      </CardContent>
    </Card>
  );
}
