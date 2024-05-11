import { useState } from "react";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { hash } from "bcryptjs";
import { firebaseConfig } from "@/models/Config";
import { initializeApp } from "firebase/app";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
const Signin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleSignin = async () => {
    if (password !== confirmPassword) {
      alert("Password and Confirm Password do not match");
      return;
    }
    const hashedPassword = await hash(password, 3);
    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const userRef = collection(db, "Login");
      await addDoc(userRef, { username, password: hashedPassword });
      router.push("/login_service/login");
    } catch (error) {
      console.error("Error signing up: ", error);
    }
  };
  return (
    <>
    <Box>
      <Typography textAlign='center' variant='h3'>Sign In</Typography>
      <TextField
        type="text"
        label="Username"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        type="password"
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        type="password"
        label="Confirm Password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button sx={{ display: 'block', margin: 'auto' }} variant="contained" color="primary" onClick={handleSignin}>
        Sign In
      </Button>
    </Box></>
    
  );
};

export default Signin;