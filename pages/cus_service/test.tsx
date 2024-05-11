import { Box } from "@mui/material";
import React from "react";
import { Table, useFetchTables } from "@/models/Tables";

const Test = () => {
  const tables = useFetchTables();

  return (
    <Box>
      <h2>List of Table IDs:</h2>
      <ul>
        {tables.map((table: Table) => (
          <li key={table.id}>
            {}
            <a href={`/cus_service/menu/?tableId=${table.id}`}>
              Table ID: {table.id}
            </a>
          </li>
        ))}
      </ul>
    </Box>
  );
};

export default Test;
