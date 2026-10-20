"use client";

import { useId } from "react";

const controlClass =
  "w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-[--dur-micro] placeholder:text-ink-3 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium text-ink-2"
      >
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  invalid,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={`${controlClass} ${
        invalid ? "border-danger" : "border-rule hover:border-rule-strong"
      } focus:border-accent ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  invalid,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={`${controlClass} resize-y ${
        invalid ? "border-danger" : "border-rule hover:border-rule-strong"
      } focus:border-accent ${className}`}
      {...props}
    />
  );
}

export function Select({
  invalid,
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={`${controlClass} appearance-none bg-[length:0] ${
        invalid ? "border-danger" : "border-rule hover:border-rule-strong"
      } focus:border-accent ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function useFieldIds(prefix: string) {
  const id = useId();
  return { inputId: `${prefix}-${id}`, labelId: `${prefix}-${id}-label` };
}
