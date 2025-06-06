import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  minRows?: number;
  maxRows?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth = false, className = '', minRows = 3, maxRows = 6, ...props }, ref) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={minRows}
          className={`
            appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-slate-400
            focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm
            ${error ? 'border-red-300' : 'border-slate-300'}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

export default Textarea;
