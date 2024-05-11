import { useEffect, useState } from "react";
import { initializeApp, getApp } from "firebase/app";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { firebaseConfig } from "@/models/Config";
import { parse, isAfter, isBefore } from "date-fns";

export class BillItem {
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

export class BillDetails {
  id: string;
  items: BillItem[];
  date: Date;
  paymentStatus: boolean;
  tableId: string;
  totalPrice: number;

  constructor(
    id: string,
    items: BillItem[],
    date: Date,
    paymentStatus: boolean,
    tableId: string,
    totalPrice: number
  ) {
    this.id = id;
    this.items = items;
    this.date = date;
    this.paymentStatus = paymentStatus;
    this.tableId = tableId;
    this.totalPrice = totalPrice;
  }
}
// Hàm custom hook sử dụng fetchData
export function useFetchBills() {
  const [bills, setBills] = useState<BillDetails[]>([]);
  const [noDataMessage, setNoDataMessage] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        const billDetailsCollection = collection(db, "Bills");
        const querySnapshot = await getDocs(billDetailsCollection);

        const billsData: BillDetails[] = [];

        querySnapshot.forEach((doc) => {
          const billData = doc.data();
          const { id, items, date, paymentStatus, totalPrice, tableId } =
            billData;

          const billItems: BillItem[] = items.map((item: any) => {
            return new BillItem(
              item.menu_id,
              item.menu_name,
              item.orderdetails_price,
              item.quantity,
              item.note,
              item.itemstatus
            );
          });

          // Parse date string to Date object using date-fns
          const parsedDate = parse(date, "d/M/yyyy H:m:s", new Date());

          const billDetails = new BillDetails(
            id,
            billItems,
            parsedDate, // Chuyển đổi thành đối tượng Date bao gồm cả thời gian
            paymentStatus,
            tableId,
            totalPrice
          );
          billsData.push(billDetails);
        });

        if (billsData.length === 0) {
          setNoDataMessage("No bills found.");
        } else {
          setNoDataMessage("");
        }

        setBills(billsData);
      } catch (error) {
        console.error("Error fetching bills: ", error);
      }
    };

    fetchData();
  }, []);

  return { bills, noDataMessage };
}
