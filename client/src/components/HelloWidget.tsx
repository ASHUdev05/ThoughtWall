import React from "react";
import { useHello } from "../hooks/useHello";

const HelloWidget: React.FC = () => {
  const { data, loading, error } = useHello();

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4 border rounded">
      <h1>API Response:</h1>
      <p>{data}</p>
    </div>
  );
};

export default HelloWidget;
