import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg border transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-secondary-50 disabled:cursor-not-allowed
            ${error
              ? 'border-error-300 focus:border-error-500 focus:ring-error-200'
              : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-200'
            }
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-error-600">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-secondary-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg border transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0 resize-y min-h-[100px]
            disabled:bg-secondary-50 disabled:cursor-not-allowed
            ${error
              ? 'border-error-300 focus:border-error-500 focus:ring-error-200'
              : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-200'
            }
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-error-600">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-secondary-500">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-secondary-700 mb-1.5">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg border transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-secondary-50 disabled:cursor-not-allowed
            bg-white cursor-pointer
            ${error
              ? 'border-error-300 focus:border-error-500 focus:ring-error-200'
              : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-200'
            }
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-sm text-error-600">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-secondary-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
