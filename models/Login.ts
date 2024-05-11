import { getApp, initializeApp } from "firebase/app";
import { firebaseConfig } from "./Config";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { useEffect, useState } from "react";

export class Login {
  id: string;
  username: string;
  password: string;
  constructor(id: string, username: string, password: string) {
    this.id = id;
    this.username = username;
    this.password = password;
  }
}

export function useFetchLogin() {
  const [logins, setLogins] = useState<Login[]>([]);
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

    const fetchData = async () => {
      try {
        const loginCollection = collection(db, "Login");
        const loginSnapshot = await getDocs(loginCollection);
        const loginList = loginSnapshot.docs.map((doc) => {
          const data = doc.data();
          return new Login(doc.id, data.username, data.password);
        });
        setLogins(loginList);
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

  return logins;
}
