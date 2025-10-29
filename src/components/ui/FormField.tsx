import * as React from 'react';
import { useFormField } from '@/hooks/useFormField';
import { cn } from '@/lib/utils';

type FormFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  renderInput?: (props: any) => React.ReactNode;
};

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({
    id,
    name,
    label,
    description,
    error,
    className,
    containerClassName,
    labelClassName,
    errorClassName,
    renderInput,
    ...props
  }, ref) => {
    const fieldProps = useFormField({
      id: id || name || '',
      name,
      type: props.type,
      required: props.required,
      autoComplete: props.autoComplete,
    });

    return (
      <div ref={ref} className={cn('space-y-2', containerClassName)}>
        <label
          htmlFor={fieldProps.id}
          className={cn('block text-sm font-medium text-gray-700', labelClassName)}
        >
          {label}
          {props.required && <span className="text-red-500">*</span>}
        </label>
        
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
        
        <div className="mt-1">
          {renderInput ? (
            renderInput(fieldProps)
          ) : (
            <input
              {...fieldProps}
              {...props}
              className={cn(
                'block w-full rounded-md border-gray-300 shadow-sm',
                'focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
                error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                className
              )}
            />
          )}
        </div>
        
        {error && (
          <p className={cn('text-sm text-red-600', errorClassName)}>{error}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { FormField };
