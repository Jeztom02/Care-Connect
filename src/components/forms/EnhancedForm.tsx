import * as React from 'react';
import { useForm, FormProvider, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form as ShadcnForm } from '@/components/ui/form';

type EnhancedFormProps<T extends FieldValues> = {
  children: React.ReactNode | ((methods: UseFormReturn<T>) => React.ReactNode);
  onSubmit: (data: T) => Promise<void> | void;
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  className?: string;
  submitButtonText?: string;
  submitButtonProps?: React.ComponentProps<typeof Button>;
  resetOnSubmit?: boolean;
};

function EnhancedForm<T extends FieldValues>({
  children,
  onSubmit,
  schema,
  defaultValues,
  className,
  submitButtonText = 'Submit',
  submitButtonProps,
  resetOnSubmit = false,
}: EnhancedFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: 'onChange',
  });

  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data);
      if (resetOnSubmit) {
        form.reset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <FormProvider {...form}>
      <ShadcnForm {...form}>
        <form 
          onSubmit={form.handleSubmit(handleSubmit)} 
          className={cn('space-y-6', className)}
        >
          {typeof children === 'function' ? children(form) : children}
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !form.formState.isValid}
              {...submitButtonProps}
            >
              {form.formState.isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin">
                    <svg className="h-full w-full" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </span>
                  Submitting...
                </>
              ) : (
                submitButtonText
              )}
            </Button>
          </div>
        </form>
      </ShadcnForm>
    </FormProvider>
  );
}

export { EnhancedForm };

export function useEnhancedFormContext<T extends FieldValues>() {
  return useFormContext<T>();
}
