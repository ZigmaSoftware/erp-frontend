const DEFAULT_ERROR_MESSAGE = "Something went wrong while processing the request.";

type ApiErrorWithResponse = {
  response?: {
    data?: unknown;
  };
};

const resolveErrorValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map(resolveErrorValue).join(", ");
  }

  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const formatResponseData = (data: unknown): string | null => {
  if (!data) {
    return null;
  }

  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(resolveErrorValue).join(", ");
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (!entries.length) {
      return null;
    }

    return entries
      .map(([key, value]) => `${key}: ${resolveErrorValue(value)}`)
      .join("\n");
  }

  return resolveErrorValue(data);
};

export const extractErrorMessage = (error: unknown): string => {
  if (!error) {
    return DEFAULT_ERROR_MESSAGE;
  }

  if (typeof error === "string") {
    return error;
  }

  const responseData = (error as ApiErrorWithResponse)?.response?.data;
  const formatted = formatResponseData(responseData);

  if (formatted) {
    return formatted;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return DEFAULT_ERROR_MESSAGE;
};
