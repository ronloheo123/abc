import { useEffect, useState } from "react";
import { initializeApp, getApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { firebaseConfig } from "@/models/Config";

export class Menu {
  id: string;
  name: string;
  price: number;
  path: string;
  type: string;
  show: boolean;
  constructor(
    id: string,
    name: string,
    price: number,
    path: string,
    type: string,
    show: boolean
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.path = path;
    this.type = type;
    this.show = show;
  }
}

export function useFetchMenus() {
  const [menus, setMenus] = useState<Menu[]>([]);
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
    // const db = getFirestore(app);
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const fetchData = async () => {
      try {
        const menuCollection = collection(db, "Menus");
        const menuSnapshot = await getDocs(menuCollection);
        const menuList = menuSnapshot.docs.map((doc) => {
          const data = doc.data();
          return new Menu(
            doc.id,
            data.name,
            data.price,
            data.path,
            data.type,
            data.show
          );
        });
        setMenus(menuList);
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

  return menus;
}
