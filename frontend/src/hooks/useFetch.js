import { useEffect, useState } from "react";

const useFetch = (request, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    request()
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err.response?.data?.message || err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, dependencies);

  return { data, loading, error, setData };
};

export default useFetch;
