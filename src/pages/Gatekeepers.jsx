
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Gatekeeper } from "@/api/entities";
import { useAppData } from "./Layout.jsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, RefreshCw, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import GatekeeperTable from "../components/gatekeepers/GatekeeperTable";
import GatekeeperForm from "../components/gatekeepers/GatekeeperForm";
import GatekeeperLinkDialog from "../components/gatekeepers/GatekeeperLinkDialog";

export default function GatekeepersPage() {
  const { user, school } = useAppData() || {}; // Use data from layout

  const [gatekeepers, setGatekeepers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGatekeeper, setEditingGatekeeper] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [linkGatekeeper, setLinkGatekeeper] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Get role name based on institute type
  const getRoleName = useCallback(() => {
    if (!school) return "Gatekeeper";
    return school.institute_type === 'school' ? 'Gatekeeper' : 'Incharge';
  }, [school]);

  const getRoleNamePlural = useCallback(() => {
    if (!school) return "Gatekeepers";
    return school.institute_type === 'school' ? 'Gatekeepers' : 'Incharges';
  }, [school]);

  const loadGatekeepers = useCallback(async () => {
    if (!school) {
      // Don't toast here, as this can be called on initial render before school is ready
      return;
    }
    setIsLoading(true);
    try {
      // REMOVED ARTIFICIAL DELAY
      const fetchedGatekeepers = await Gatekeeper.filter({ school_id: school.id });
      setGatekeepers(fetchedGatekeepers);
      setDataLoaded(true);
      // Only toast on initial successful load if data was fetched for the first time
      if (fetchedGatekeepers.length > 0 && !dataLoaded) { 
          toast.success(`Loaded ${fetchedGatekeepers.length} ${getRoleNamePlural().toLowerCase()}.`);
      }
    } catch (error) {
      toast.error(`Failed to load ${getRoleNamePlural().toLowerCase()}.`, { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [school, dataLoaded, getRoleNamePlural]); // useCallback dependency - also include dataLoaded to prevent toast on every refresh

  // Load gatekeepers automatically when the component mounts and school data is available
  useEffect(() => {
    if (school) { // Ensure school is available before loading
        loadGatekeepers();
    }
  }, [school, loadGatekeepers]);

  const handleFormSubmit = async (gatekeeperData) => {
    if (!school) {
      toast.error("No school context found. Cannot add or update gatekeeper.");
      return;
    }
    try {
      if (editingGatekeeper) {
        await Gatekeeper.update(editingGatekeeper.id, gatekeeperData);
        toast.success(`${getRoleName()} updated successfully!`);
      } else {
        const gatekeeper_id = `GK-${Math.floor(100 + Math.random() * 900)}`;
        await Gatekeeper.create({ 
          ...gatekeeperData, 
          school_id: school.id,
          gatekeeper_id,
        });
        toast.success(`${getRoleName()} added successfully!`);
      }
      setShowForm(false);
      setEditingGatekeeper(null);
      loadGatekeepers(); // Reload data
    } catch (error) {
      toast.error(`Failed to save ${getRoleName().toLowerCase()}.`, { description: error.message });
    }
  };

  const handleEdit = (gatekeeper) => {
    setEditingGatekeeper(gatekeeper);
    setShowForm(true);
  };

  const handleDelete = async (gatekeeperId) => {
    if (window.confirm(`Are you sure you want to delete this ${getRoleName().toLowerCase()}?`)) {
      try {
        await Gatekeeper.delete(gatekeeperId);
        loadGatekeepers(); // Reload data
        toast.success(`${getRoleName()} deleted successfully!`);
      } catch (error) {
        toast.error(`Failed to delete ${getRoleName().toLowerCase()}.`, { description: error.message });
      }
    }
  };
  
  const generateLink = (gatekeeper) => setLinkGatekeeper(gatekeeper);
  const handleCloseForm = () => { setShowForm(false); setEditingGatekeeper(null); };

  const filteredGatekeepers = useMemo(() => {
    if (!dataLoaded) return [];
    return gatekeepers.filter(gk =>
      gk.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gk.gate_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [gatekeepers, searchTerm, dataLoaded]);

  if (!school) {
    return (
        <div className="p-6 text-center">
             <p className="text-slate-500">Initializing {getRoleName().toLowerCase()} management...</p>
        </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{getRoleName()} Management</h1>
            <p className="text-slate-600 mt-1">Manage all {getRoleNamePlural().toLowerCase()} and their access for {school ? school.school_name : "your institute"}</p>
          </div>
          <div className="flex gap-3">
             <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700" disabled={!school}>
                <Plus className="w-4 h-4 mr-2" /> Add {getRoleName()}
             </Button>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <GatekeeperForm
              gatekeeper={editingGatekeeper}
              roleName={getRoleName()}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseForm}
            />
          )}
        </AnimatePresence>
        
        <Card className="shadow-lg border-0">
          <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle>All {getRoleNamePlural()} ({dataLoaded ? filteredGatekeepers.length : "Loading..."})</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder={`Search by ${getRoleName().toLowerCase()} name or gate...`}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!dataLoaded && !isLoading} // Disable search while initial data is not loaded
                />
              </div>
              <Button onClick={loadGatekeepers} disabled={isLoading || !school}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && !dataLoaded ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading {getRoleNamePlural()}...</p>
                </div>
            ) : (
                <GatekeeperTable 
                  gatekeepers={filteredGatekeepers}
                  isLoading={isLoading}
                  roleName={getRoleName()}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onGenerateLink={generateLink}
                />
            )}
          </CardContent>
        </Card>
      </div>
      {linkGatekeeper && (
        <GatekeeperLinkDialog
          gatekeeper={linkGatekeeper}
          roleName={getRoleName()}
          onOpenChange={() => setLinkGatekeeper(null)}
        />
      )}
    </>
  );
}
