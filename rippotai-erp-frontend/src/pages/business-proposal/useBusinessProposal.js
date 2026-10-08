import { useEffect, useState } from "react";
import api from "@/lib/api";
export function useBusinessProposal(id) {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setRecord(null);
    setError("");
    if (id)
      api
        .get(`/business-proposals/${id}`)
        .then(({ data }) => {
          if (active) setRecord(data);
        })
        .catch(() => {
          if (active) setError("Could not load this business proposal.");
        });
    return () => {
      active = false;
    };
  }, [id]);
  return { record, error };
}
