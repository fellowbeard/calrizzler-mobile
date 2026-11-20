import { useCallback, useEffect, useRef, useState } from "react";

type ZipLookupResponse = {
  places?: {
    "place name": string;
    "state abbreviation": string;
  }[];
};

type ZipLookupResult = {
  city: string;
  state: string;
};

export function useZipLookup() {
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);
  const [zipError, setZipError] = useState("");

  const requestId = useRef(0);

  const cancelLookup = useCallback(() => {
    requestId.current += 1;
    setIsLookingUpZip(false);
    setZipError("");
  }, []);

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  const lookupZip = useCallback(
    async (value: string, onSuccess: (result: ZipLookupResult) => void) => {
      const zip = value.replace(/\D/g, "").slice(0, 5);

      requestId.current += 1;
      const currentRequestId = requestId.current;

      setZipError("");

      if (zip.length !== 5) {
        setIsLookingUpZip(false);
        return zip;
      }

      setIsLookingUpZip(true);

      try {
        const response = await fetch(`https://api.zippopotam.us/us/${zip}`);

        if (!response.ok) {
          throw new Error("ZIP code not found.");
        }

        const data: ZipLookupResponse = await response.json();
        const place = data.places?.[0];

        if (!place) {
          throw new Error("No city or state found for this ZIP code.");
        }

        if (currentRequestId !== requestId.current) {
          return zip;
        }

        onSuccess({
          city: place["place name"],
          state: place["state abbreviation"],
        });
      } catch (error) {
        if (currentRequestId !== requestId.current) {
          return zip;
        }

        setZipError(
          error instanceof Error ? error.message : "Unable to look up ZIP code."
        );
      } finally {
        if (currentRequestId === requestId.current) {
          setIsLookingUpZip(false);
        }
      }

      return zip;
    },
    []
  );

  return {
    lookupZip,
    cancelLookup,
    isLookingUpZip,
    zipError,
  };
}
