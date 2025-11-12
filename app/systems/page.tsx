'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import {
  getSystems,
  addSystem,
  updateSystem,
  deleteSystem,
  calculateStreak,
  getTodayString,
  type System,
} from '@/lib/systems-db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Edit2, Pause, Play, Trash2, Flame } from 'lucide-react';

export default function SystemsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [systems, setSystems] = useState<System[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);
  const [deletingSystemId, setDeletingSystemId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formTrigger, setFormTrigger] = useState('');
  const [formFull, setFormFull] = useState('');
  const [formSurvival, setFormSurvival] = useState('');

  useEffect(() => {
    setMounted(true);
    checkAuthAndLoad();
  }, [router]);

  const checkAuthAndLoad = async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      router.push('/login');
      return;
    }
    await loadSystems();
  };

  const loadSystems = async () => {
    try {
      const allSystems = await getSystems();
      setSystems(allSystems);

      const today = getTodayString();
      const newStreaks: Record<string, number> = {};
      for (const system of allSystems) {
        newStreaks[system.id] = await calculateStreak(system.id, today);
      }
      setStreaks(newStreaks);
    } catch (error) {
      console.error('Error loading systems:', error);
    }
  };

  const handleEdit = (system: System) => {
    setEditingSystem(system);
    setFormName(system.name);
    setFormTrigger(system.trigger);
    setFormFull(system.full);
    setFormSurvival(system.survival);
    setIsEditOpen(true);
  };

  const handleAdd = () => {
    setEditingSystem(null);
    setFormName('');
    setFormTrigger('');
    setFormFull('');
    setFormSurvival('');
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formTrigger.trim() || !formFull.trim() || !formSurvival.trim()) {
      return;
    }

    try {
      if (editingSystem) {
        await updateSystem(editingSystem.id, {
          name: formName.trim(),
          trigger: formTrigger.trim(),
          full: formFull.trim(),
          survival: formSurvival.trim(),
        });
      } else {
        await addSystem({
          name: formName.trim(),
          trigger: formTrigger.trim(),
          full: formFull.trim(),
          survival: formSurvival.trim(),
          isPaused: false,
        });
      }

      setIsEditOpen(false);
      await loadSystems();
    } catch (error) {
      console.error('Error saving system:', error);
    }
  };

  const handleTogglePause = async (system: System) => {
    try {
      await updateSystem(system.id, { isPaused: !system.isPaused });
      await loadSystems();
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  };

  const handleDeleteClick = (systemId: string) => {
    setDeletingSystemId(systemId);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingSystemId) {
      try {
        await deleteSystem(deletingSystemId);
        setIsDeleteOpen(false);
        setDeletingSystemId(null);
        await loadSystems();
      } catch (error) {
        console.error('Error deleting system:', error);
      }
    }
  };

  const canAddMore = systems.length < 5;

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Manage Systems</h1>
              <p className="text-sm text-slate-600">Edit, pause, or add new habits</p>
            </div>
          </div>
          {canAddMore && (
            <Button
              onClick={handleAdd}
              className="bg-[#106981] hover:bg-[#0d5468] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add System
            </Button>
          )}
        </header>

        {!canAddMore && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-sm text-amber-800">
                You've reached the maximum of 5 systems. Delete a system to add a new one.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {systems.map((system) => {
            const streak = streaks[system.id] || 0;

            return (
              <Card
                key={system.id}
                className={`border-slate-200 shadow-sm ${
                  system.isPaused ? 'opacity-60 bg-slate-50' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg font-medium text-slate-900">
                          {system.name}
                        </CardTitle>
                        {system.isPaused && (
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-600 font-medium">
                            Paused
                          </span>
                        )}
                        {streak > 0 && !system.isPaused && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50">
                            <Flame className="h-3 w-3 text-red-500" fill="currentColor" />
                            <span className="text-xs font-bold text-red-700">{streak}</span>
                          </div>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        Trigger: {system.trigger}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(system)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTogglePause(system)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        {system.isPaused ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(system.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-slate-700">Full Action:</span>
                    <p className="text-sm text-slate-600">{system.full}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">Survival Mode:</span>
                    <p className="text-sm text-slate-600">{system.survival}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingSystem ? 'Edit System' : 'Add New System'}
              </DialogTitle>
              <DialogDescription>
                {editingSystem
                  ? 'Update your system details below'
                  : 'Create a new habit system to track'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">System Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Morning Movement"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="border-slate-300 focus:border-[#106981] focus:ring-[#106981]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger / When</Label>
                <Input
                  id="trigger"
                  placeholder="e.g., After waking up"
                  value={formTrigger}
                  onChange={(e) => setFormTrigger(e.target.value)}
                  className="border-slate-300 focus:border-[#106981] focus:ring-[#106981]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full">Full Action</Label>
                <Input
                  id="full"
                  placeholder="e.g., 30-min walk/gym"
                  value={formFull}
                  onChange={(e) => setFormFull(e.target.value)}
                  className="border-slate-300 focus:border-[#106981] focus:ring-[#106981]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="survival">Survival Action</Label>
                <Input
                  id="survival"
                  placeholder="e.g., 5-min stretch"
                  value={formSurvival}
                  onChange={(e) => setFormSurvival(e.target.value)}
                  className="border-slate-300 focus:border-[#106981] focus:ring-[#106981]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!formName.trim() || !formTrigger.trim() || !formFull.trim() || !formSurvival.trim()}
                className="bg-[#106981] hover:bg-[#0d5468] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingSystem ? 'Save Changes' : 'Add System'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete System?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this system and all its tracking history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
