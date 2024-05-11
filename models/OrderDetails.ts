import { useEffect, useState } from "react";
import { initializeApp, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { firebaseConfig } from "@/models/Config";
import {
  query,
  where,
  QuerySnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";

// Định nghĩa một lớp mới để phản ánh cấu trúc dữ liệu của mỗi mục trong items array
export class OrderItem {
  menu_id: string;
  menu_name: string;
  orderdetails_price: number;
  quantity: number;
  note: string;
  itemstatus: boolean;

  constructor(
    menu_id: string,
    menu_name: string,
    orderdetails_price: number,
    quantity: number,
    note: string = "",
    itemstatus: boolean = true
  ) {
    this.menu_id = menu_id;
    this.menu_name = menu_name;
    this.orderdetails_price = orderdetails_price;
    this.quantity = quantity;
    this.note = note;
    this.itemstatus = itemstatus;
  }
}

// Cập nhật lớp OrderDetails để chứa mảng các mục được chọn
export class OrderDetails {
  id: string;
  items: OrderItem[];
  date: Date;
  paymentStatus: boolean;
  totalPrice: number;

  constructor(
    id: string,
    items: OrderItem[],
    date: Date,
    paymentStatus: boolean,
    totalPrice: number
  ) {
    this.id = id;
    this.items = items;
    this.date = date;
    this.paymentStatus = paymentStatus;
    this.totalPrice = totalPrice;
  }
}

export function useFetchOrderDetails(tableId: string) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails[]>([]);

  useEffect(() => {
    // let app;
    // try {
    //   app = getApp();
    // } catch (error) {
    //   app = initializeApp(firebaseConfig);
    // }
    // const db = getFirestore(app);
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const orderDetailsCollection = collection(db, "OrderDetails");
    const q = query(orderDetailsCollection, where("tableId", "==", tableId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedOrderDetailsList: OrderDetails[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const id = doc.id;
        const items = data.items.map(
          (item: any) =>
            new OrderItem(
              item.menu_id,
              item.menu_name,
              item.orderdetails_price,
              item.quantity
            )
        );
        updatedOrderDetailsList.push(
          new OrderDetails(
            id,
            items,
            data.date,
            data.paymentStatus,
            data.totalPrice
          )
        );
      });
      setOrderDetails(updatedOrderDetailsList);
    });

    return () => unsubscribe();
  }, [tableId]);

  return orderDetails;
}

export function useFetchOrderHandle() {
  const [orderDetails, setOrderDetails] = useState<OrderDetails[]>([]);

  useEffect(() => {
    // // Kiểm tra xem ứng dụng Firebase đã tồn tại chưa
    // let app;
    // try {
    //   app = getApp();
    // } catch (error) {
    //   // Ứng dụng Firebase chưa tồn tại, hãy khởi tạo mới
    //   app = initializeApp(firebaseConfig);
    // }
    // const db = getFirestore(app);
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const fetchData = async () => {
      try {
        const orderDetailsCollection = collection(db, "OrderDetails");
        const q = query(
          orderDetailsCollection,
          where("paymentStatus", "==", false)
        );
        const querySnapshot = await getDocs(q);
        const orderDetailsList = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          // Lấy ID của OrderDetails từ doc.id
          const id = doc.id;
          // Chuyển đổi dữ liệu của mỗi mục items trong dữ liệu Firestore thành OrderItem
          const items = data.items.map(
            (item: any) =>
              new OrderItem(
                item.menu_id,
                item.menu_name,
                item.orderdetails_price,
                item.quantity
              )
          );
          return new OrderDetails(
            id,
            items,
            data.date,
            data.paymentStatus,
            data.totalPrice
          );
        });
        setOrderDetails(orderDetailsList);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
    // const interval = setInterval(() => {
    //   fetchData(); // Gọi lại fetchData sau mỗi 20 giây
    // }, 3000);
    // return () => {
    //   clearInterval(interval); // Xóa interval khi component bị unmount
    // };
  }, []);

  return orderDetails;
}
