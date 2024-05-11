import { useEffect, useState } from "react";
import { initializeApp, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { firebaseConfig } from "@/models/Config";
import { OrderDetails } from "@/models/OrderDetails";

export class Table {
  id: string;
  table_number: number;
  status: boolean;

  constructor(id: string, table_number: number, status: boolean = false) {
    this.id = id;
    this.table_number = table_number;
    this.status = status;
  }
}

export function useFetchTables() {
  const [tables, setTables] = useState<Table[]>([]);

  useEffect(() => {
    // // Kiểm tra xem ứng dụng Firebase đã tồn tại chưa
    // let app;
    // try {
    //   app = getApp();
    // } catch (error) {
    //   // Ứng dụng Firebase chưa tồn tại, hãy khởi tạo mới
    //   app = initializeApp(firebaseConfig);
    // }
    // // Sử dụng ứng dụng Firebase đã khởi tạo để tạo Firestore
    // const firestore = getFirestore(app);

    // const db = getFirestore(app);
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const fetchData = async () => {
      try {
        const tablesCollection = collection(db, "Tables");
        const tablesSnapshot = await getDocs(tablesCollection);
        const tablesList: Table[] = [];

        for (const doc of tablesSnapshot.docs) {
          const data = doc.data();
          const table = new Table(doc.id, data.table_number, data.status);
          tablesList.push(table);
        }

        // Fetch OrderDetails for each table and update table status
        for (const table of tablesList) {
          const orderDetails = await fetchOrderDetailsForTable(db, table.id);
          const hasUnpaidOrder = orderDetails.some(
            (orderDetail) => !orderDetail.paymentStatus
          );
          await updateTableStatus(db, table.id, hasUnpaidOrder);
          table.status = hasUnpaidOrder;
        }

        setTables(tablesList);
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

  return tables;
}

async function fetchOrderDetailsForTable(
  db: any,
  tableId: string
): Promise<OrderDetails[]> {
  const orderDetailsCollection = collection(db, "OrderDetails");
  const q = query(orderDetailsCollection, where("tableId", "==", tableId));
  const querySnapshot = await getDocs(q);
  const orderDetailsList: OrderDetails[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const orderDetails = new OrderDetails(
      data.id,
      data.items,
      data.orderDate,
      data.paymentStatus,
      data.totalPrice
    );
    orderDetailsList.push(orderDetails);
  });

  return orderDetailsList;
}

async function updateTableStatus(db: any, tableId: string, status: boolean) {
  const tableRef = doc(db, "Tables", tableId);
  await updateDoc(tableRef, {
    status: status,
  });
}
