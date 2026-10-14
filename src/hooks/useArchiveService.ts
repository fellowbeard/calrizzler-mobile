import { useState } from "react";

import { apiFetch } from "@/api/client";

export function useArchiveService() {
  const [error, setError] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);

  async function archiveService(id: number) {
    setError("");
    setIsArchiving(true);

    try {
      await apiFetch(`/api/v1/services/${id}`, {
        method: "DELETE",
      });

      return true;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to archive service."
      );

      return false;
    } finally {
      setIsArchiving(false);
    }
  }

  return {
    archiveService,
    error,
    isArchiving,
  };
}
