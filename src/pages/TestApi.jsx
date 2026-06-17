import { useEffect, useState } from "react";

function TestApi() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:8000/api/test")
      .then((res) => res.text())
      .then((data) => setMessage(data))
      .catch(() => setMessage("Backend Connection Failed"));
  }, []);

  return (
    <div>
      <h1>{message}</h1>
    </div>
  );
}

export default TestApi;