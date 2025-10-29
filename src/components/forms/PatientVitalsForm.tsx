import * as React from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { EnhancedForm } from './EnhancedForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { validation } from '@/lib/form-utils';

// Define the form schema using Zod
const vitalsFormSchema = z.object({
  bloodPressure: validation.required('Blood pressure is required'),
  heartRate: validation.required('Heart rate is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Must be a positive number',
    }),
  temperature: validation.required('Temperature is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Must be a positive number',
    }),
  respiratoryRate: validation.required('Respiratory rate is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Must be a positive number',
    }),
  oxygenSaturation: z.string()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100), {
      message: 'Must be between 0 and 100',
    })
    .optional(),
  weight: z.string()
    .refine((val) => !val || !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Must be a positive number',
    })
    .optional(),
  height: z.string()
    .refine((val) => !val || !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Must be a positive number',
    })
    .optional(),
  notes: z.string().optional(),
});

type VitalsFormValues = z.infer<typeof vitalsFormSchema>;

interface PatientVitalsFormProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onSubmit: (data: VitalsFormValues) => Promise<void>;
  defaultValues?: Partial<VitalsFormValues>;
}

export function PatientVitalsForm({ 
  patientId, 
  onSuccess, 
  onCancel,
  onSubmit,
  defaultValues,
}: PatientVitalsFormProps) {
  const handleSubmit = async (data: VitalsFormValues) => {
    try {
      await onSubmit(data);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting vitals:', error);
      throw error;
    }
  };

  return (
    <EnhancedForm
      schema={vitalsFormSchema}
      onSubmit={handleSubmit}
      defaultValues={defaultValues}
      submitButtonText="Record Vitals"
      className="space-y-4"
    >
      {(form) => (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bloodPressure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Pressure (mmHg)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="120/80" 
                      {...field} 
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="heartRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heart Rate (bpm)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number" 
                        inputMode="numeric"
                        min="0"
                        step="1"
                        placeholder="72" 
                        {...field} 
                        autoComplete="off"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">bpm</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperature (°C)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number" 
                        inputMode="decimal"
                        min="30"
                        max="45"
                        step="0.1"
                        placeholder="36.8" 
                        {...field} 
                        autoComplete="off"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">°C</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="respiratoryRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Respiratory Rate (breaths/min)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number" 
                        inputMode="numeric"
                        min="0"
                        step="1"
                        placeholder="16" 
                        {...field} 
                        autoComplete="off"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">/min</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="oxygenSaturation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oxygen Saturation (%)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number" 
                        inputMode="decimal"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="98" 
                        {...field} 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                        autoComplete="off"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number" 
                        inputMode="decimal"
                        min="0"
                        step="0.1"
                        placeholder="70.5" 
                        {...field} 
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                        autoComplete="off"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">kg</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          inputMode="decimal"
                          min="0"
                          step="0.1"
                          placeholder="175" 
                          {...field} 
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                          autoComplete="off"
                        />
                        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">cm</span>
                      </div>
                    </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional notes about the patient's condition..." 
                    className="min-h-[100px]"
                    {...field} 
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                  />
                </FormControl>
                <FormDescription>
                  Any additional observations or notes about the patient's condition.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-3 pt-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={!form.formState.isValid || form.formState.isSubmitting || !form.formState.isDirty}
            >
              {form.formState.isSubmitting ? 'Saving...' : 'Save Vitals'}
            </Button>
          </div>
        </>
      )}
    </EnhancedForm>
  );
}
