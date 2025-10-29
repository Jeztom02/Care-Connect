import React, { useState, useMemo } from 'react';
import { format, addDays, isToday, isAfter, isBefore, isSameDay, parseISO } from 'date-fns';
import { CheckCircle2, AlertCircle, Clock, Pills, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModernCard } from '@/components/ui/ModernCard';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { cn } from '@/lib/utils';

type MedicationStatus = 'taken' | 'missed' | 'pending' | 'upcoming';

interface MedicationDose {
  id: string;
  time: string;
  status: MedicationStatus;
  takenAt?: string;
  notes?: string;
}

interface MedicationSchedule {
  id: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'weekly' | 'as_needed';
  startDate: string;
  endDate?: string;
  instructions?: string;
  doses: MedicationDose[];
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  lastTaken?: string;
  nextDose?: string;
  adherence: number; // percentage 0-100
}

interface MedicationTrackerProps {
  medications: MedicationSchedule[];
  onDoseTaken?: (medicationId: string, doseId: string) => void;
  onMedicationAdd?: () => void;
  onMedicationEdit?: (id: string) => void;
  onMedicationDelete?: (id: string) => void;
  className?: string;
  showActions?: boolean;
  daysToShow?: number;
}

// Generate time slots for a day
const generateTimeSlots = (medication: MedicationSchedule): MedicationDose[] => {
  if (medication.frequency === 'as_needed') {
    return [];
  }

  // Default to 3 times a day (morning, afternoon, evening)
  const times = ['08:00', '14:00', '20:00'];
  
  return times.map((time, index) => ({
    id: `${medication.id}-dose-${index}`,
    time,
    status: 'pending' as const,
  }));
};

// Calculate medication adherence percentage
const calculateAdherence = (medication: MedicationSchedule): number => {
  if (medication.doses.length === 0) return 100;
  
  const takenCount = medication.doses.filter(dose => dose.status === 'taken').length;
  return Math.round((takenCount / medication.doses.length) * 100);
};

/**
 * A component for tracking medication schedules and adherence.
 */
export function MedicationTracker({
  medications: propMedications,
  onDoseTaken,
  onMedicationAdd,
  onMedicationEdit,
  onMedicationDelete,
  className,
  showActions = true,
  daysToShow = 7,
}: MedicationTrackerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Generate mock data if none provided
  const medications = useMemo(() => {
    if (propMedications && propMedications.length > 0) {
      return propMedications.map(med => ({
        ...med,
        adherence: calculateAdherence(med),
      }));
    }

    // Generate mock medications
    return Array.from({ length: 3 }, (_, i) => {
      const med: MedicationSchedule = {
        id: `med-${i + 1}`,
        name: ['Ibuprofen', 'Amoxicillin', 'Lisinopril', 'Metformin', 'Atorvastatin'][i % 5],
        dosage: ['200mg', '500mg', '10mg', '1000mg', '20mg'][i % 5],
        frequency: ['daily', 'daily', 'daily', 'twice_daily', 'as_needed'][i % 5] as any,
        startDate: subDays(new Date(), 7).toISOString(),
        endDate: addDays(new Date(), 30).toISOString(),
        instructions: ['Take with food', 'Take with water', 'Before bedtime', 'As needed for pain'][i % 4],
        status: 'active',
        doses: [],
        adherence: Math.floor(Math.random() * 30) + 70, // 70-100%
      };

      med.doses = generateTimeSlots(med);
      return med;
    });
  }, [propMedications]);

  // Filter medications for the selected date
  const filteredMedications = useMemo(() => {
    return medications.filter(med => {
      const startDate = new Date(med.startDate);
      const endDate = med.endDate ? new Date(med.endDate) : null;
      
      return (
        med.status === 'active' &&
        (isSameDay(selectedDate, startDate) || isAfter(selectedDate, startDate)) &&
        (!endDate || isSameDay(selectedDate, endDate) || isBefore(selectedDate, endDate))
      );
    });
  }, [medications, selectedDate]);

  // Generate date range for the date selector
  const dateRange = useMemo(() => {
    return Array.from({ length: daysToShow }, (_, i) => {
      const date = addDays(new Date(), i);
      return {
        date,
        formattedDate: format(date, 'd'),
        dayOfWeek: format(date, 'EEE'),
        isToday: isToday(date),
        isSelected: isSameDay(selectedDate, date),
      };
    });
  }, [selectedDate, daysToShow]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDoseClick = (medicationId: string, doseId: string) => {
    if (onDoseTaken) {
      onDoseTaken(medicationId, doseId);
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId && onMedicationDelete) {
      onMedicationDelete(confirmDeleteId);
    }
    setConfirmDeleteId(null);
  };

  const getDoseStatus = (dose: MedicationDose, med: MedicationSchedule): MedicationStatus => {
    if (dose.status === 'taken') return 'taken';
    if (dose.status === 'missed') return 'missed';
    
    const doseTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${dose.time}`);
    const now = new Date();
    
    if (isToday(selectedDate) && isAfter(now, doseTime)) {
      return 'missed';
    }
    
    if (isToday(selectedDate) && isBefore(now, doseTime)) {
      return 'upcoming';
    }
    
    return 'pending';
  };

  const getStatusIcon = (status: MedicationStatus) => {
    switch (status) {
      case 'taken':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'missed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'upcoming':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: MedicationStatus) => {
    switch (status) {
      case 'taken':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'missed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Medication Schedule</h2>
        {showActions && onMedicationAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMedicationAdd}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Medication
          </Button>
        )}
      </div>

      {/* Date Selector */}
      <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2">
        {dateRange.map(({ date, formattedDate, dayOfWeek, isToday, isSelected }) => (
          <button
            key={date.toString()}
            type="button"
            onClick={() => handleDateSelect(date)}
            className={cn(
              'flex flex-col items-center justify-center w-14 h-16 rounded-lg transition-colors',
              isSelected
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800',
              isToday && 'border-2 border-primary-500'
            )}
          >
            <span className="text-xs font-medium">{dayOfWeek}</span>
            <span className="text-lg font-semibold">{formattedDate}</span>
          </button>
        ))}
      </div>

      {filteredMedications.length === 0 ? (
        <ModernCard className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Pills className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No medications scheduled</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {showActions ? 'Add a medication to get started.' : 'Check back later for scheduled medications.'}
          </p>
          {showActions && onMedicationAdd && (
            <div className="mt-6">
              <Button onClick={onMedicationAdd}>
                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
                Add Medication
              </Button>
            </div>
          )}
        </ModernCard>
      ) : (
        <div className="space-y-4">
          {filteredMedications.map(medication => (
            <ModernCard key={medication.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {medication.name}
                    </h3>
                    <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {medication.dosage}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {medication.instructions}
                  </p>
                </div>
                
                {showActions && (
                  <div className="flex items-center space-x-2">
                    {onMedicationEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMedicationEdit(medication.id)}
                      >
                        Edit
                      </Button>
                    )}
                    {onMedicationDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                        onClick={() => handleDeleteClick(medication.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Today's Doses</span>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="mr-2">Adherence: {medication.adherence}%</span>
                    <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          medication.adherence >= 90 ? 'bg-green-500' :
                          medication.adherence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${medication.adherence}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {medication.doses.map(dose => {
                    const status = getDoseStatus(dose, medication);
                    return (
                      <button
                        key={dose.id}
                        type="button"
                        onClick={() => handleDoseClick(medication.id, dose.id)}
                        disabled={status !== 'pending' || !onDoseTaken}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border transition-colors',
                          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                          status === 'taken' && 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10',
                          status === 'missed' && 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10',
                          status === 'upcoming' && 'border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10',
                          status === 'pending' && 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
                          !onDoseTaken && 'cursor-default'
                        )}
                      >
                        <div className="flex items-center">
                          {getStatusIcon(status)}
                          <span className="ml-2 text-sm font-medium">
                            {dose.time}
                          </span>
                        </div>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          getStatusColor(status)
                        )}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </ModernCard>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Medication"
        description="Are you sure you want to delete this medication? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}

// Helper functions
function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
