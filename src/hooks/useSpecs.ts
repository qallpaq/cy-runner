import { useEffect, useState } from "react";

import { cyApi } from "../api";

export const useSpecs = (query: string) => {
  const [specs, setSpecs] = useState<string[]>([]);

  useEffect(() => {
    if (!query) {
      setSpecs([]);
      return;
    }

    cyApi.getSpecs(query).then(setSpecs);
  }, [query]);

  return specs;
};
