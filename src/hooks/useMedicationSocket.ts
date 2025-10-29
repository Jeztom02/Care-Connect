import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import { useToast } from '@/components/ui/use-toast';

export function useMedicationSocket(patientId?: string) {
  const { socket, connected, on } = useSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Invalidate relevant queries when medication data changes
  const invalidateQueries = () => {
    if (patientId) {
      queryClient.invalidateQueries({ queryKey: ['medications', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medicationStats', patientId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['medicationStats'] });
    }
  };

  // Handle medication-related WebSocket events
  useEffect(() => {
    if (!connected || !socket) return;

    // Join patient room if patientId is provided
    if (patientId) {
      socket.emit('join:patient', { patientId });
    }

    // Set up event listeners
    const onMedicationAdded = (data: any) => {
      toast({
        title: 'Medication Added',
        description: `${data.medication.name} has been added to the medication list.`,
      });
      invalidateQueries();
    };

    const onMedicationUpdated = (data: any) => {
      toast({
        title: 'Medication Updated',
        description: `${data.medication.name} has been updated.`,
      });
      invalidateQueries();
    };

    const onMedicationDeleted = (data: any) => {
      toast({
        title: 'Medication Removed',
        description: 'A medication has been removed from the list.',
      });
      invalidateQueries();
    };

    const onMedicationAdministered = (data: any) => {
      toast({
        title: 'Medication Administered',
        description: `Medication has been marked as administered.`,
      });
      invalidateQueries();
    };

    const onMedicationMissed = (data: any) => {
      toast({
        title: 'Medication Missed',
        description: data.reason || 'A scheduled medication was missed.',
        variant: 'destructive',
      });
      invalidateQueries();
    };

    // Register event listeners
    socket.on('medication:added', onMedicationAdded);
    socket.on('medication:updated', onMedicationUpdated);
    socket.on('medication:deleted', onMedicationDeleted);
    socket.on('medication:administered', onMedicationAdministered);
    socket.on('medication:missed', onMedicationMissed);
    socket.on('medication:schedule_updated', invalidateQueries);

    // Cleanup function
    return () => {
      if (!socket) return;
      
      // Leave patient room if joined
      if (patientId) {
        socket.emit('leave:patient', { patientId });
      }
      
      // Remove all medication event listeners
      socket.off('medication:added', onMedicationAdded);
      socket.off('medication:updated', onMedicationUpdated);
      socket.off('medication:deleted', onMedicationDeleted);
      socket.off('medication:administered', onMedicationAdministered);
      socket.off('medication:missed', onMedicationMissed);
      socket.off('medication:schedule_updated', invalidateQueries);
    };
  }, [connected, socket, patientId, queryClient, toast]);

  return {
    connected,
    emit: socket?.emit.bind(socket),
  };
}
