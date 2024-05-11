import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";
import { initializeApp, getApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  getDoc,
} from "firebase/firestore";
const Cart = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const firebaseConfig = {
    apiKey: "AIzaSyAKE4ePUsVfXd8Nh7Bj9msbroBd_7tvbzg",
    authDomain: "tableorder-90826.firebaseapp.com",
    projectId: "tableorder-90826",
    storageBucket: "tableorder-90826.appspot.com",
    messagingSenderId: "723306684078",
    appId: "1:723306684078:web:ca7f0fcc45dbc2ec02173f",
    measurementId: "G-QSTWZS9F78",
  };
  // Kiểm tra xem ứng dụng Firebase đã tồn tại chưa
  let app;
  try {
    app = getApp();
  } catch (error) {
    // Ứng dụng Firebase chưa tồn tại, hãy khởi tạo mới
    app = initializeApp(firebaseConfig);
  }

  // Sử dụng ứng dụng Firebase đã khởi tạo để tạo Firestore
  const firestore = getFirestore(app);
  const router = useRouter();
  const [note, setNote] = useState(""); // State để lưu trữ giá trị ghi chú
  const [products, setProducts] = useState<
    Array<{
      id: string;
      quantity: number;
      note: string;
      name: string;
      price: number;
      path: string;
      type: string;
      tableId: string;
      show: boolean;
    }>
  >([]);
  useEffect(() => {
    const storedCartItems = localStorage.getItem("cartItems");
    if (storedCartItems) {
      setProducts(JSON.parse(storedCartItems));
    }
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  // Hàm tăng số lượng sản phẩm
  const increaseQuantity = (index: number) => {
    const newProducts = [...products];
    newProducts[index].quantity++;
    setProducts(newProducts);
    localStorage.setItem("cartItems", JSON.stringify(newProducts));
  };
  // Hàm giảm số lượng sản phẩm
  const decreaseQuantity = (index: number) => {
    const newProducts = [...products];
    if (newProducts[index].quantity > 0) {
      newProducts[index].quantity--;
      setProducts(newProducts);
      localStorage.removeItem("cartItems");
    }
    if (newProducts[index].quantity === 0) {
      newProducts.splice(index, 1);
      setProducts(newProducts);
      localStorage.setItem("cartItems", JSON.stringify(newProducts));
    }
  };

  // Tính tổng giá trị của các sản phẩm trong giỏ hàng
  const calculateTotalPrice = () => {
    let totalPrice = 0;
    products.forEach((product) => {
      totalPrice = totalPrice + product.quantity * product.price;
    });
    return totalPrice;
  };

  const handleExit = () => {
    router.push("/cus_service/menu/");
  };
  const handleNoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNote(event.target.value); // Cập nhật giá trị ghi chú vào state
  };

  const totalPrice = calculateTotalPrice();
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const seconds = currentDate.getSeconds();
  const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  const sendOrder = async () => {
    // Cập nhật trạng thái show mới nhất từ cơ sở dữ liệu
    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        const docRef = doc(firestore, "Menus", product.id);
        const docSnap = await getDoc(docRef);
        const updatedShow = docSnap.data()?.show || false;
        return { ...product, show: updatedShow };
      })
    );

    // Loại bỏ các sản phẩm không hợp lệ khỏi danh sách
    const validProducts = updatedProducts.filter(
      (product) => product.show && product.id
    );

    // Cập nhật trạng thái show trong localStorage
    localStorage.setItem("cartItems", JSON.stringify(validProducts));

    // Cập nhật products state với validProducts
    setProducts(validProducts);

    console.log(validProducts); // Đã được cập nhật từ cơ sở dữ liệu

    const invalidProducts = updatedProducts.filter((product) => !product.show);

    if (invalidProducts.length > 0) {
      const invalidProductNames = invalidProducts
        .map((product) => product.name)
        .join(", ");
      alert(`${invalidProductNames} tạm dừng phục vụ. Vui lòng chọn món khác.`);
      return;
    }

    if (validProducts.length === 0) {
      alert("Không có sản phẩm hợp lệ để gửi đơn hàng.");
      return;
    }
    const orderRef = collection(firestore, "OrderDetails");
    let tableId = "";
    if (validProducts.length > 0) {
      const firstProduct = validProducts.find(
        (product) => product.tableId !== undefined && product.tableId !== null
      );
      tableId = firstProduct ? firstProduct.tableId : "";
    }

    const order = {
      paymentStatus: false,
      tableId: tableId,
      totalPrice: totalPrice,
      date: formattedDate,
      items: validProducts.map((product) => ({
        menu_id: product.id,
        menu_name: product.name,
        quantity: product.quantity,
        note: product.note ? product.note : note,
        orderdetails_price: product.quantity * product.price,
      })),
    };

    setShowSuccessMessage(true);
    addDoc(orderRef, order).then(() => {
      setProducts([]);
      localStorage.removeItem("cartItems");
    });
  };
  const BackMenu = () => {
    const tableId = router.query.tableId;
    router.push(`/cus_service/menu?tableId=${tableId}`);
  };
  return (
    <>
      <Box
        sx={{
          background: "#C50023",
          height: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Typography
          sx={{
            color: "white",
            fontWeight: 600,
          }}
          variant="h5"
        >
          THÔNG TIN ĐƠN HÀNG
        </Typography>
      </Box>
      {/* Hiểnthị*/}
      <Box sx={{ p: "20px 0px 0px 0px" }}>
        <Stack display="flex" gap="20px">
          {products.map((product, index) => (
            <Stack
              key={index}
              direction={"row"}
              justifyContent="space-between"
              sx={{
                padding: "5px",
                backgroundColor: "#fff9c4",
                width: "99%",
                borderRadius: "16px",
              }}
            >
              <Box
                component="img"
                src={`${product.path}`}
                sx={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "16px",
                }}
              />
              <Stack pl={"5px"}>
                <Typography style={{ fontSize: "13px", fontWeight: "bold" }}>
                  {product.name}
                </Typography>
                <Stack direction={"row"}>
                  <TextField
                    id="standard-basic"
                    label="Ghi chú"
                    value={note} // Giá trị ghi chú từ state
                    onChange={handleNoteChange} // Xử lý sự kiện khi thay đổi ghi chú
                    onFocus={() => setIsKeyboardOpen(true)}
                    onBlur={() => setIsKeyboardOpen(false)}
                    variant="standard"
                    style={{ fontSize: "10px", fontStyle: "italic" }}
                    sx={{ width: "100%" }}
                    InputProps={{
                      style: {
                        fontSize: "15px",
                        background: "transparent",
                      },
                    }}
                  />
                  <Stack sx={{ width: "100%" }}>
                    <Typography
                      style={{ fontSize: "15px" }}
                      sx={{
                        fontWeight: 700,
                        color: "red",
                        textAlign: "right",
                      }}
                    >
                      {(product.quantity * product.price).toLocaleString(
                        "vi-VN"
                      )}{" "}
                      VND
                    </Typography>
                    <Stack
                      sx={{ justifyContent: "flex-end" }}
                      direction={"row"}
                      spacing={0}
                    >
                      <IconButton
                        sx={{ padding: "0" }}
                        onClick={() => decreaseQuantity(index)}
                      >
                        <IndeterminateCheckBoxIcon />
                      </IconButton>
                      <TextField
                        value={product.quantity}
                        variant="standard"
                        inputProps={{
                          style: {
                            textAlign: "center",
                            maxWidth: "30px",
                          },
                        }}
                      />
                      <IconButton
                        sx={{ padding: "0" }}
                        onClick={() => increaseQuantity(index)}
                      >
                        <LocalHospitalIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Box>
      {/* Hiên thi thong bao */}
      {showSuccessMessage && (
        <Box
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 128, 0, 0.8)",
            color: "white",
            padding: "10px",
            width: "200px",
            height: "100px",
            borderRadius: "8px",
            zIndex: 9999,
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography>Chọn món thành công!</Typography>
          <Button
            variant="contained"
            onClick={() => {
              setShowSuccessMessage(false);
              BackMenu();
            }}
            style={{ marginTop: "20px" }}
          >
            Oke
          </Button>
        </Box>
      )}

      {/* Hiển thị tổng giá trị */}
      <Typography
        sx={{
          textAlign: "right",
          color: "#d50000",
          fontWeight: "bold",
          mt: "10px",
          mr: "5px",
        }}
      >
        Tổng cộng: {calculateTotalPrice().toLocaleString("vi-VN")} VND
      </Typography>

      {/* Button điều hướng và thoát */}
      <Box
        sx={{
          position: "fixed",
          bottom: isMobile && isKeyboardOpen ? "100vh" : 0,
          left: 0,
          right: 0,
          padding: 2,
          background: "#fff",
        }}
      >
        <Stack spacing={1}>
          <Button
            variant="contained"
            style={{ width: "100%", background: "#C50023", color: "#ffffff" }}
            onClick={sendOrder}
          >
            Gửi đơn
          </Button>
          <Button
            variant="contained"
            style={{ width: "100%", background: "#ffffff", color: "gray" }}
            onClick={BackMenu}
          >
            Thoát
          </Button>
        </Stack>
      </Box>
    </>
  );
};

export default Cart;
