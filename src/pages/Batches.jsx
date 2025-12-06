import React, { useState, useEffect, useCallback } from "react";
import { Batch } from "@/api/entities";
import { useAppData } from "../layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Clock, Users } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import BatchForm from "../components/batches/BatchForm";

export default function BatchesPage() {
  const { school } = useAppData() || {};
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const loadBatches = useCallback(async () => {
    if (!school) return;
    setIsLoading(true);
    try {
      const fetchedBatches = await Batch.filter({ school_id: school.id });
      setBatches(fetchedBatches);
    } catch (error) {
      toast.error("Failed to load batches.");
    } finally {
      setIsLoading(false);
    }
  }, [school]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleFormSubmit = async (batchData) => {
    try {
      if (editingBatch) {
        await Batch.update(editingBatch.id, batchData);
        toast.success("Batch updated successfully!");
      } else {
        await Batch.create({ ...batchData, school_id: school.id });
        toast.success("New batch created successfully!");
      }
      setShowForm(false);
      setEditingBatch(null);
      loadBatches();
    } catch (error) {
      toast.error("Failed to save batch details.");
    }
  };

  const handleDelete = async (batchId) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      try {
        await Batch.delete(batchId);
        loadBatches();
        toast.success("Batch deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete batch.");
      }
    }
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setShowForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Batch Management</h1>
          <p className="text-slate-600 mt-1">Create and manage batches for your institute.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create New Batch
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <BatchForm
            batch={editingBatch}
            onSubmit={handleFormSubmit}
            onCancel={() => { setShowForm(false); setEditingBatch(null); }}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p>Loading batches...</p>
        ) : (
          batches.map(batch => (
            <Card key={batch.id} className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{batch.batch_name}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(batch)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(batch.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>{batch.start_time} - {batch.end_time}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-4 h-4" />
                  <span>Max {batch.max_capacity} students</span>
                </div>
                <p className="text-slate-500 pt-2">{batch.days_of_week?.join(', ')}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}