"use client";

import React, { useState, useEffect, useCallback } from "react";

interface NumInputProps {
  value: number | string | null;
  onChange: (val: number | null) => void;
  className?: string;
  placeholder?: string;
  title?: string;
  dir?: "ltr" | "rtl";
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

/**
 * NumInput - A specialized input component that enforces Western Arabic (English) numerals (0-9).
 * Prevents browser-level localization (Hindi numerals) by using type="text" and inputMode="decimal".
 */
export function NumInput({
  value,
  onChange,
  className,
  placeholder,
  title,
  dir = "ltr",
  id,
  disabled,
  readOnly,
}: NumInputProps) {
  const [localVal, setLocalVal] = useState<string>(
    value === 0 || value === "0" ? "0" : value?.toString() || "",
  );

  const [isFocused, setIsFocused] = useState(false);

  // Sync local state if numeric value changes from outside
  useEffect(() => {
    if (isFocused) return;

    const stringVal =
      value === 0 || value === "0" ? "0" : value?.toString() || "";
    const currentNum = parseFloat(localVal);
    const targetNum = parseFloat(stringVal);

    if (
      (Number.isNaN(currentNum) && Number.isNaN(targetNum)) ||
      currentNum === targetNum
    ) {
      if (localVal === stringVal) return;
      if (
        (localVal === "" && targetNum === 0) ||
        (stringVal === "" && currentNum === 0)
      ) {
      } else {
        return;
      }
    }

    setLocalVal(stringVal);
  }, [value, isFocused, localVal]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Allow only Western numerals, decimal point, and minus sign
      if (/^-?\d*\.?\d*$/.test(raw)) {
        setLocalVal(raw);

        if (raw === "" || raw === "-" || raw === ".") {
          onChange(null);
          return;
        }

        const num = parseFloat(raw);
        if (!isNaN(num)) {
          onChange(num);
        }
      }
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const inputs = Array.from(
          document.querySelectorAll(
            'input:not([type="hidden"]):not([disabled])',
          ),
        ) as HTMLInputElement[];
        const index = inputs.indexOf(e.currentTarget);
        if (index > -1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
          inputs[index + 1].select();
        }
      }
    },
    [],
  );

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      lang="en"
      suppressHydrationWarning
      dir={dir}
      value={localVal}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      readOnly={readOnly}
      onFocus={() => {
        setIsFocused(true);
        if (typeof window !== "undefined") {
          setTimeout(() => {
            const input = document.activeElement as HTMLInputElement;
            if (input) input.select();
          }, 0);
        }
      }}
      onBlur={() => setIsFocused(false)}
      className={className}
      placeholder={placeholder}
      title={title}
      autoComplete="off"
    />
  );
}
