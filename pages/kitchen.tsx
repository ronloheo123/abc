import React, { useEffect, useState } from "react";
import { useFetchTables } from "@/models/Tables";
import { Box, Button, Grid, TableHead, Typography } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import { Menu, useFetchMenus } from "@/models/Menu";
import { useFetchOrderDetails } from "@/models/OrderDetails";
import "react-confirm-alert/src/react-confirm-alert.css";
import { styled } from "@mui/material/styles";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import Table from "@mui/material/Table"; // Thêm import Table

const ManageTable = () => {
  const tables = useFetchTables();
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const orderDetails = useFetchOrderDetails(selectedTableId);
  const fetchedMenus = useFetchMenus();
  const [value, setValue] = useState<number | number[]>(1);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [menuTypes, setMenuTypes] = useState<string[]>([]);

  const handleTableClick = (tableId: string) => {
    setSelectedTableId(tableId);
  };

  const findMenuById = (menuId: string) => {
    return menus.find((menu) => menu.id === menuId);
  };

  useEffect(() => {
    setMenus(fetchedMenus);
    const types = fetchedMenus.map((menu) => menu.type);
    setMenuTypes(Array.from(new Set(types)));
  }, [fetchedMenus]);

  useEffect(() => {
    if (menus.length > 0) {
      setShowMenu(true);
    }
  }, [menus]);

  const sortedTables = [...tables].sort(
    (a, b) => a.table_number - b.table_number
  );

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
    },
  }));

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
    "&:last-child td, &:last-child th": {
      border: 0,
    },
  }));

  const sortedOrderDetails = [...orderDetails].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <>
      <TabContext value={value.toString()}>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Grid container spacing={2} justifyContent="center">
            {sortedTables.map((table, index) => (
              <Grid key={table.id} item style={{ width: "20%" }}>
                <Button
                  value={table.id}
                  onClick={() => handleTableClick(table.id)}
                  sx={{
                    background: table.status ? "blue" : "white",
                    color: table.status ? "white" : "black",
                    width: "100%",
                  }}
                >
                  {`Bàn số ${table.table_number}`}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Grid item xs={12}>
          <Typography
            fontSize={"30px"}
            fontWeight={"bolder"}
            textAlign={"center"}
          >
            Sản Phẩm
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {sortedOrderDetails.map((orderDetail, orderIndex) => (
              <Grid key={orderIndex} item style={{ width: "600px" }}>
                <Box
                  sx={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                    marginTop: "10px",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ marginBottom: "10px" }}
                  >{`OrderDetail #${orderIndex + 1}`}</Typography>
                  <Typography variant="subtitle1">{`Ngày: ${orderDetail.date}`}</Typography>
                  <Table>
                    <Box
                      style={{
                        marginBottom: "20px",
                        overflowY: "auto",
                        maxHeight: 210,
                      }}
                    >
                      <TableBody>
                        {orderDetail.items.map((item, index) => (
                          <StyledTableRow key={index}>
                            <StyledTableCell style={{ width: 400 }}>
                              {item.menu_name}
                            </StyledTableCell>
                            <StyledTableCell style={{ width: 100 }}>
                              {item.quantity}
                            </StyledTableCell>
                          </StyledTableRow>
                        ))}
                      </TableBody>
                    </Box>
                  </Table>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </TabContext>
    </>
  );
};

export default ManageTable;
