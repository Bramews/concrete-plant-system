import { useState, useEffect } from "react";
import { checkFieldAvailability } from "@/app/actions/user-management";

export function useFieldValidation(
  field: "email" | "username",
  value: string,
  ignoreUserId?: number,
  debounceMs: number = 500,
) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!value) {
      setIsAvailable(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    setIsAvailable(null);

    const timer = setTimeout(async () => {
      try {
        const available = await checkFieldAvailability(
          field,
          value,
          ignoreUserId,
        );
        setIsAvailable(available);
      } catch (error) {
        console.error(`Error validating ${field}:`, error);
        setIsAvailable(null);
      } finally {
        setIsValidating(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, field, ignoreUserId, debounceMs]);

  return { isAvailable, isValidating };
}
