import React, { useEffect, useState } from "react";
import { useFetchTables, Table } from "@/models/Tables";
import { firebaseConfig } from "@/models/Config";
import { initializeApp, getApp } from "firebase/app";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  ListItem,
  MenuItem,
  Select,
  Stack,
  Tab,
  TextField,
  Typography,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import AddIcon from "@mui/icons-material/Add";
import { Menu, useFetchMenus } from "@/models/Menu";
import {
  OrderItem,
  OrderDetails,
  useFetchOrderDetails,
} from "@/models/OrderDetails";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
  WriteBatch,
  getDoc,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getStorage } from "firebase/storage";
import { confirmAlert } from "react-confirm-alert"; // Import thư viện react-confirm-alert
import "react-confirm-alert/src/react-confirm-alert.css";
import { query, where, getDocs } from "firebase/firestore";
import { Console } from "console";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { green } from "@mui/material/colors";
import BillDisplay from "./bills";

const ManageTable = () => {
  const tables = useFetchTables();

  const [selectedTableId, setSelectedTableId] = useState<string>(""); // Đặt giá trị mặc định là chuỗi rỗng
  const orderDetails = useFetchOrderDetails(selectedTableId);

  const fetchedMenus = useFetchMenus();

  // Kiểm tra xem ứng dụng Firebase đã tồn tại chưa
  // let app;
  // try {
  //   app = getApp();
  // } catch (error) {
  //   // Ứng dụng Firebase chưa tồn tại, hãy khởi tạo mới
  //   app = initializeApp(firebaseConfig);
  // }

  // // Sử dụng ứng dụng Firebase đã khởi tạo để tạo Firestore
  // const firestore = getFirestore(app);
  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);

  const [value, setValue] = React.useState<number | number[]>(1);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuImage, setNewMenuImage] = useState<File | null>(null); // State để lưu trữ hình ảnh
  const [newMenuType, setNewMenuType] = useState("");
  const [newMenuShow, setNewMenuShow] = useState(true);

  const [menuTypes, setMenuTypes] = useState<string[]>([]); // State để lưu trữ danh sách thể loại // State để lưu trữ thông tin món đang được chỉnh sửa
  const [editMenu, setEditMenu] = useState<Menu | null>(null); // State để lưu trữ thông tin món đang được chỉnh sửa async

  const handlePaymentConfirmation = async (
    tableId: string,
    totalPayment: number
  ) => {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Truy vấn để lấy tên của bàn từ ID
    const tableRef = doc(db, "Tables", tableId);
    const tableDoc = await getDoc(tableRef);
    const tableName = tableDoc.data()?.table_number || "Bàn không xác định";
    confirmAlert({
      title: "Xác Nhận Thanh Toán",
      message: `Xác nhận thanh toán cho bàn số ${tableName} với tổng tiền là ${totalPayment.toLocaleString(
        "vi-VN"
      )} VNĐ?`,
      buttons: [
        {
          label: "Đồng Ý",
          onClick: async () => {
            try {
              const app = initializeApp(firebaseConfig);
              const db = getFirestore(app);
              await runTransaction(db, async () => {
                const orderDetailsRef = collection(db, "OrderDetails");
                const querySnapshot = await getDocs(
                  query(orderDetailsRef, where("tableId", "==", tableId))
                );
                querySnapshot.forEach(async (doc) => {
                  const billRef = collection(db, "Bills");
                  const orderDetailData = doc.data();
                  await addDoc(billRef, {
                    ...orderDetailData,
                    paymentStatus: true,
                  });
                  await deleteDoc(doc.ref);
                });
              });

              window.location.reload();
            } catch (error) {
              console.error("Error updating payment status: ", error);
            }
          },
        },
        {
          label: "Hủy",
          onClick: () => {
            // Hủy bỏ xác nhận thanh toán
          },
        },
      ],
    });
  };

  const typeMapping = {
    All: "Tất cả",
    Pickle: "Đồ chua - Bánh mì",
    Beverages: "Nước ngọt - Trà",
    Beef: "Bò nướng",
    Meat: "Heo - Gà - Hải sản",
    Soda: "Soda mùi",
    Vegetable: "Rau nướng",
    Hotpots: "Lẩu",
    Combo: "Combo Nướng & Lẩu",
    Sausace: "Sốt",
  };
  const getTypeName = (type: keyof typeof typeMapping) =>
    typeMapping[type] || type;

  const handleChange = (
    event: React.ChangeEvent<{}>,
    newValue: number | number[]
  ) => {
    setValue(newValue);
  };

  const handleTableClick = (tableId: string) => {
    setSelectedTableId(tableId);
  };

  const findMenuById = (menuId: string) => {
    return menus.find((menu) => menu.id === menuId);
  };

  const handleToggleShowMenu = async (menuId: string, menuName: string) => {
    try {
      const confirmed = window.confirm(
        `Bạn có muốn ${
          menus.find((m) => m.id === menuId)?.show ? "ẩn" : "hiển thị"
        } ${menuName} trong menu không?`
      );

      if (confirmed) {
        // Đảo ngược trạng thái show của menu
        const updatedShowStatus = !menus.find((m) => m.id === menuId)?.show;

        // Cập nhật trạng thái show của menu trong cơ sở dữ liệu
        await updateDoc(doc(firestore, "Menus", menuId), {
          show: updatedShowStatus,
        });

        // Cập nhật trạng thái show của menu trong state
        setMenus((prevMenus) =>
          prevMenus.map((m) =>
            m.id === menuId ? { ...m, show: updatedShowStatus } : m
          )
        );
      }
    } catch (error) {
      console.error("Error toggling menu show status: ", error);
      alert(
        "Cập nhật trạng thái hiển thị món không thành công. Vui lòng thử lại sau."
      );
    }
  };

  // Sử dụng hook useFetchMenus trực tiếp trong component
  const menusFromAPI = useFetchMenus();

  useEffect(() => {
    setMenus(fetchedMenus);
    // Lấy danh sách các thể loại từ danh sách món ăn
    const types = fetchedMenus.map((menu) => menu.type);
    // Loại bỏ các thể loại trùng lặp và cập nhật state
    setMenuTypes(Array.from(new Set(types)));
  }, [fetchedMenus]);

  useEffect(() => {
    // Lắng nghe thay đổi của biến menusFromAPI
    // và cập nhật biến menus và showMenu khi dữ liệu đã được lấy thành công
    if (menusFromAPI.length > 0) {
      setMenus(menusFromAPI);
      setShowMenu(true);
    }
  }, [menusFromAPI]);

  // Biến trạng thái để theo dõi hiển thị phần thêm mới
  const [addingNew, setAddingNew] = useState(false);

  // Hàm xử lý khi nhấn nút AddIcon
  const handleAddNew = () => {
    setAddingNew(true); // Hiển thị phần thêm mới
    setSelectedMenu(null); // Đặt selectedMenu về null để các trường còn lại trống
    setNewMenuShow(true);
    setNewMenuName("");
    setNewMenuPrice("");
    setNewMenuImage(null);
    setNewMenuType("");
  };

  const handleAddMenu = async () => {
    try {
      // Lấy tham chiếu đến dịch vụ lưu trữ Firebase
      const storage = getStorage(app);

      // Kiểm tra các trường nhập liệu có được điền đầy đủ hay không
      if (
        !newMenuName ||
        !newMenuPrice ||
        !newMenuImage ||
        !newMenuType ||
        newMenuShow === undefined
      ) {
        throw new Error("Điền vào tất cả các mục");
      }

      // Lấy tên file hình ảnh từ state
      const fileName = newMenuImage.name;
      const storageRef = ref(storage, `menuImages/${fileName}`);
      await uploadBytes(storageRef, newMenuImage);

      // Lấy đường dẫn của hình ảnh đã tải lên
      const imageURL = await getDownloadURL(storageRef);

      // Tạo một đối tượng menu mới từ thông tin nhập vào, bao gồm đường dẫn hình ảnh
      const newMenu = new Menu(
        "", // ID sẽ được tạo tự động
        newMenuName,
        parseFloat(newMenuPrice),
        imageURL,
        newMenuType,
        newMenuShow
      );

      // Thêm menu mới vào Firestore
      const docRef = await addDoc(collection(firestore, "Menus"), {
        name: newMenu.name,
        price: newMenu.price,
        path: newMenu.path,
        type: newMenu.type,
        show: newMenu.show,
      });

      // Cập nhật danh sách menu sau khi thêm thành công
      setMenus((prevMenus) => [...prevMenus, newMenu]);

      // Reset các trường input về giá trị mặc định sau khi thêm menu thành công
      setNewMenuName("");
      setNewMenuPrice("");
      setNewMenuImage(null);
      setNewMenuType("");

      alert("Upload to Firebase successful!");
    } catch (error) {
      console.error("Error adding menu: ", error);
      // Hiển thị alert thất bại
      alert(error);
    }
  };

  const handleDeleteMenu = async (
    menuId: string,
    menuName: string,
    imagePath: string
  ) => {
    try {
      // Hiển thị bảng xác nhận trước khi xóa
      confirmAlert({
        title: "Xác nhận xóa menu",
        message: `Bạn có muốn xóa ${menuName} khỏi thực đơn hay không?`,
        buttons: [
          {
            label: "Có",
            onClick: async () => {
              // Xóa menu khỏi Firestore dựa trên menuId
              await deleteDoc(doc(firestore, "Menus", menuId));

              // Cập nhật danh sách menu sau khi xóa thành công
              setMenus((prevMenus) =>
                prevMenus.filter((menu) => menu.id !== menuId)
              );

              // Xóa hình ảnh khỏi Firebase Storage
              const storage = getStorage(app);
              const imageRef = ref(storage, imagePath);
              await deleteObject(imageRef);
              setSelectedMenu(null);
            },
          },
          {
            label: "Không",
            onClick: () => {
              setSelectedMenu(null);
            }, // Không làm gì khi nhấn nút "Không"
          },
        ],
      });
    } catch (error) {
      console.error("Error deleting menu: ", error);
      // Hiển thị alert thất bại
      alert("Delete menu failed. Please try again later.");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Lấy file hình ảnh từ sự kiện onChange
    const file = e.target.files?.[0];
    if (file) {
      setNewMenuImage(file);
    }
  };

  const handleSaveMenu = async () => {
    try {
      if (!selectedMenu) {
        return; // Nếu editMenu là null thì không thực hiện các xử lý tiếp theo
      }
      const storage = getStorage(app);

      // Nếu người dùng đã chọn một hình ảnh mới
      if (newMenuImage) {
        // Tải hình ảnh mới lên Firebase Storage
        const fileName = newMenuImage.name;
        const storageRef = ref(storage, `menuImages/${fileName}`);
        await uploadBytes(storageRef, newMenuImage);

        // Lấy đường dẫn mới của hình ảnh
        const imageURL = await getDownloadURL(storageRef);

        // Xóa hình ảnh cũ từ Firebase Storage
        if (selectedMenu.path) {
          const oldImageRef = ref(storage, selectedMenu.path);
          await deleteObject(oldImageRef);
        }

        // Cập nhật đường dẫn mới của hình ảnh vào menu
        selectedMenu.path = imageURL;
      }

      // Thực hiện cập nhật dữ liệu vào cơ sở dữ liệu
      await updateDoc(doc(firestore, "Menus", selectedMenu.id), {
        name: selectedMenu.name,
        price: selectedMenu.price,
        path: selectedMenu.path,
        type: selectedMenu.type,
      });

      // Cập nhật lại danh sách menu sau khi cập nhật thành công
      setMenus((prevMenus) =>
        prevMenus.map((menu) =>
          menu.id === selectedMenu.id ? { ...menu, ...selectedMenu } : menu
        )
      );

      // Đặt editMenu về null để ẩn vùng hiển thị thông tin của món
      setSelectedMenu(null);
      setNewMenuImage(null);

      // Hiển thị thông báo lưu thành công
      alert("Menu saved successfully!");
    } catch (error) {
      console.error("Error saving menu: ", error);
      alert("Save menu failed. Please try again later.");
    }
  };
  // Tính tổng tiền các đơn hàng
  const totalPayment = orderDetails.reduce((total, orderDetail) => {
    return total + orderDetail.totalPrice;
  }, 0);
  return (
    <>
      <TabContext value={value.toString()}>
        <Box sx={{ width: "100%", typography: "body1" }}>
          <TabContext value={value.toString()}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <TabList
                sx={{
                  "& .MuiTab-root": {
                    color: "#9e9e9e", // Màu chữ khi không được chọn
                  },
                  "& .Mui-selected": {
                    color: "white", // Màu chữ khi được chọn
                  },
                }}
                onChange={handleChange}
                aria-label="lab API tabs example"
              >
                <Tab label={`Danh Sách Bàn`} value="1" />
                <Tab label={`Danh Sách Menu`} value="2" />
                <Tab label={`Quản Lý Hóa Đơn`} value="3" />
              </TabList>
            </Box>
          </TabContext>
        </Box>
        <TabPanel value="1">
          <Grid container spacing={2}>
            {/* Grid item cho danh sách bàn */}
            <Grid item xs={7}>
              <Grid container spacing={2}>
                {tables
                  .sort((a, b) => a.table_number - b.table_number)
                  .map((table: Table) => (
                    <Grid item xs={4} key={table.table_number}>
                      <Button
                        variant="contained"
                        sx={{
                          height: "100px",
                          width: "200px",
                          background: table.status ? "" : "white",
                          color: table.status ? "white" : "black",
                        }}
                        onClick={() => handleTableClick(table.id)}
                      >
                        {`Bàn số ${table.table_number}`}
                      </Button>
                    </Grid>
                  ))}
              </Grid>
            </Grid>
            <Grid item xs={5}>
              <Typography fontSize={"30px"} fontWeight={"bolder"}>
                Phiếu Thanh Toán
              </Typography>
              {/* Phần orderDetails */}
              <Box
                sx={{
                  padding: 2,
                  background: "#fff",
                  maxHeight: "400px", // Giữ phần orderDetails cách phần tổng tiền và các nút
                  overflowY: "auto", // Tạo thanh cuộn khi nội dung vượt quá kích thước
                }}
              >
                {/* Phần orderDetails */}
                <Grid item xs={12}>
                  {/* Render order details based on selectedTableId */}
                  {orderDetails.map((orderDetail, orderIndex) => (
                    <div key={orderIndex}>
                      {/* Hiển thị ID của OrderDetails */}
                      {/* <Typography variant="subtitle1">
                        ID:{" "}
                        {Array.isArray(orderDetail.id)
                          ? orderDetail.id.join(" - ")
                          : orderDetail.id}
                      </Typography> */}
                      {/* Lặp qua từng mục trong orderDetail.items */}
                      {orderDetail.items.map((item, index) => (
                        <div key={index}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              {/* Tên và thông tin khác về menu */}
                              <Typography variant="subtitle1">
                                {item.menu_name}
                                {/* {findMenuById(item.menu_id)?.name} */}
                              </Typography>
                            </Grid>
                            <Grid item xs={1}>
                              <Typography variant="subtitle1">
                                {item.quantity}
                              </Typography>
                            </Grid>
                            <Grid item xs={2}>
                              <Typography variant="subtitle1">
                                {item.orderdetails_price.toLocaleString(
                                  "vi-VN"
                                )}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="subtitle1">
                                {item.orderdetails_price.toLocaleString(
                                  "vi-VN"
                                )}{" "}
                                VNĐ
                              </Typography>
                            </Grid>
                          </Grid>
                        </div>
                      ))}
                      {/* Thêm dấu gạch ngang sau mỗi OrderDetails */}
                      {orderIndex < orderDetails.length - 1 && (
                        <hr
                          style={{
                            borderTop: "1px dashed black",
                            margin: "10px 0",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </Grid>
              </Box>
              {/* Phần tổng tiền và các nút */}
              <Box
                sx={{
                  position: "fixed",
                  bottom: 0,
                  padding: 2,
                  background: "#fff",
                  marginTop: 2, // Tạo khoảng cách giữa phần orderDetails và phần tổng tiền và các nút
                  width: "100%",
                }}
              >
                <Stack direction="row" spacing={3}>
                  <Typography>
                    Tổng tiền:{`${totalPayment.toLocaleString("vi-VN")}VND`}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    style={{
                      height: "50px",
                      width: "150px",
                      color: "white",
                      backgroundColor: "green",
                    }}
                    onClick={() =>
                      handlePaymentConfirmation(selectedTableId, totalPayment)
                    }
                  >
                    Thanh Toán
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        <TabPanel value="2">
          <Stack direction={"row"}>
            <Box>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                sx={{ width: "100px" }}
                onClick={handleAddNew} // Gọi hàm xử lý khi nhấn nút AddIcon
              >
                Thêm
              </Button>
              <Box
                sx={{
                  maxHeight: "500px",
                  overflowY: "auto",
                  marginTop: "20px",
                }}
              >
                {showMenu && (
                  <Box sx={{ p: "16px 10px 16px 10px" }}>
                    {menus
                      .filter((menu) => menu.price !== 0)
                      .sort((a, b) => b.price - a.price)
                      .map((menu, index) => (
                        <Grid item key={index}>
                          <ListItem onClick={() => setSelectedMenu(menu)}>
                            <Grid container spacing={2}>
                              {/* Phần hình ảnh */}
                              <Grid item xs={3}>
                                <Box
                                  component="img"
                                  alt={menu.name}
                                  src={menu.path}
                                  sx={{
                                    width: "120px",
                                    height: "120px",
                                    borderRadius: "16px",
                                  }}
                                />
                              </Grid>
                              {/* Phần name và price */}
                              <Grid item xs={6}>
                                <Stack direction="column">
                                  <Typography sx={{ fontWeight: 700 }}>
                                    {menu.name}
                                  </Typography>
                                  <Typography sx={{ fontWeight: 700 }}>
                                    {menu.price.toLocaleString("vi-VN")}VNĐ
                                  </Typography>
                                </Stack>
                              </Grid>
                              {/* Phần button Delete */}
                              <Grid item xs={3}>
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                >
                                  {menu.show ? (
                                    <VisibilityIcon
                                      sx={{ color: "green", cursor: "pointer" }}
                                      onClick={() =>
                                        handleToggleShowMenu(menu.id, menu.name)
                                      }
                                    />
                                  ) : (
                                    <VisibilityOffIcon
                                      sx={{ color: "gray", cursor: "pointer" }}
                                      onClick={() =>
                                        handleToggleShowMenu(menu.id, menu.name)
                                      }
                                    />
                                  )}
                                  <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    sx={{ width: "100px" }}
                                    onClick={() =>
                                      handleDeleteMenu(
                                        menu.id,
                                        menu.name,
                                        menu.path
                                      )
                                    }
                                  >
                                    Xóa
                                  </Button>
                                </Stack>
                              </Grid>
                            </Grid>
                          </ListItem>
                        </Grid>
                      ))}
                  </Box>
                )}
              </Box>
            </Box>
            <Box sx={{ position: "sticky", top: 0 }}>
              <Stack direction="column" spacing={2} alignItems="center">
                {/* Phần thêm mới */}
                {addingNew && !selectedMenu && (
                  <Box sx={{ p: "16px 10px 16px 10px" }}>
                    <Stack spacing={3}>
                      {/* Phần tải ảnh lên */}
                      <input type="file" onChange={handleImageChange} />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={newMenuShow}
                            onChange={(e) => setNewMenuShow(e.target.checked)}
                            color="primary"
                            icon={<VisibilityOffIcon />}
                            checkedIcon={
                              <VisibilityIcon sx={{ color: "green" }} />
                            }
                          />
                        }
                        label="Hiển thị"
                        sx={{ marginBottom: 2 }}
                      />
                    </Stack>
                    <TextField
                      id="menu-name"
                      label="Tên món"
                      value={newMenuName}
                      onChange={(e) => setNewMenuName(e.target.value)}
                      variant="outlined"
                      fullWidth
                      sx={{ marginBottom: 2, marginTop: "10px" }}
                    />
                    <TextField
                      id="menu-price"
                      label="Giá"
                      value={newMenuPrice}
                      onChange={(e) => setNewMenuPrice(e.target.value)}
                      variant="outlined"
                      fullWidth
                      sx={{ marginBottom: 2 }}
                    />
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ marginBottom: 2 }}
                    >
                      <InputLabel id="menu-type-label">Loại món</InputLabel>
                      <Select
                        labelId="menu-type-label"
                        id="menu-type"
                        value={newMenuType}
                        label="Loại món"
                        sx={{ textAlign: "left" }}
                        onChange={(e) => setNewMenuType(e.target.value)}
                      >
                        {menuTypes
                          .filter((type) =>
                            menus.some(
                              (menu) => menu.type === type && menu.price > 0
                            )
                          )
                          .map((type) => (
                            <MenuItem key={type} value={type}>
                              {getTypeName(type as keyof typeof typeMapping)}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                    <Box>
                      <Stack direction={"row"} spacing={10}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={handleAddMenu}
                        >
                          Thêm Mới
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                )}
                {selectedMenu && (
                  <Box sx={{ p: "16px 10px 16px 10px", textAlign: "center" }}>
                    <Box
                      component="img"
                      alt={selectedMenu.name}
                      src={selectedMenu.path}
                      sx={{
                        width: "200px",
                        height: "200px",
                        pb: "10px",
                        borderRadius: "16px",
                        margin: "0 auto", // Để căn giữa hình ảnh
                      }}
                    />
                    <Box>
                      <Typography>Chọn Hình ảnh mới</Typography>
                      <input type="file" onChange={handleImageChange} />
                    </Box>
                    <TextField
                      id="menu-name"
                      label="Tên món"
                      value={selectedMenu.name}
                      onChange={(e) =>
                        setSelectedMenu({
                          ...selectedMenu,
                          name: e.target.value,
                        })
                      }
                      variant="outlined"
                      fullWidth
                      sx={{ marginBottom: 2 }}
                    />
                    <TextField
                      id="menu-price"
                      label="Giá"
                      value={selectedMenu.price.toString()}
                      onChange={(e) => {
                        const value = e.target.value.trim(); // Loại bỏ các khoảng trắng từ đầu và cuối chuỗi
                        const price = value === "" ? 0 : parseFloat(value); // Chuyển đổi thành số, nếu chuỗi rỗng thì gán giá trị 0
                        setSelectedMenu({ ...selectedMenu, price });
                      }}
                      variant="outlined"
                      fullWidth
                      sx={{ marginBottom: 2 }}
                    />
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ marginBottom: 2 }}
                    >
                      <InputLabel id="menu-type-label">Thể loại</InputLabel>

                      <Select
                        labelId="menu-type-label"
                        id="menu-type"
                        value={selectedMenu ? selectedMenu.type : ""}
                        label="Loại món"
                        sx={{ textAlign: "left" }}
                        onChange={(event) =>
                          setSelectedMenu(
                            selectedMenu
                              ? {
                                  ...selectedMenu,
                                  type: event.target.value as string,
                                }
                              : null
                          )
                        }
                      >
                        {menuTypes
                          .filter((type) =>
                            menus.some(
                              (menu) => menu.type === type && menu.price > 0
                            )
                          )
                          .map((type) => (
                            <MenuItem key={type} value={type}>
                              {getTypeName(type as keyof typeof typeMapping)}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                    <Box>
                      <Stack direction={"row"} spacing={10}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSaveMenu}
                        >
                          Lưu
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>
        </TabPanel>
        <TabPanel value="3">
          <BillDisplay></BillDisplay>
        </TabPanel>
      </TabContext>
    </>
  );
};

export default ManageTable;
function commitBatch(batch: WriteBatch) {
  throw new Error("Function not implemented.");
}
