import { z } from "zod";
import { Locale } from "./dictionary.base";
import { dictionary } from "./dictionary.base";

/**
 * Creates a custom Zod Error Map based on the provided locale.
 * This can be used in Server Actions or Client Components (if dictionary is passed).
 */
export const getZodErrorMap = (locale: Locale = "ar"): z.ZodErrorMap => {
  const dict = dictionary[locale]?.api_errors || dictionary["ar"].api_errors;

  return ((issue: any, ctx: any) => {
    let message = ctx.defaultError;

    switch (issue.code) {
      case "invalid_type": {
        const received = issue.received || issue.expected;
        if (
          received === "undefined" ||
          received === "null" ||
          issue.expected === "undefined"
        ) {
          message = dict.required || "This field is required";
        } else {
          message = dict.invalid_type || "Invalid data type";
        }
        break;
      }
      case "invalid_format":
      case "invalid_string": {
        const format = issue.format || issue.validation;
        if (format === "email") {
          message = dict.invalid_email || "Invalid email address";
        }
        break;
      }
      case "too_small": {
        message =
          locale === "ar"
            ? `يجب أن يكون على الأقل ${issue.minimum}`
            : `Must be at least ${issue.minimum}`;
        break;
      }
      case "too_big": {
        message =
          locale === "ar"
            ? `يجب أن يكون أقل من ${issue.maximum}`
            : `Must be less than ${issue.maximum}`;
        break;
      }
    }

    return { message };
  }) as z.ZodErrorMap;
};
