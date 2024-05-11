import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useFetchLogin } from "@/models/Login";
import router from "next/router";
import { compare } from "bcryptjs";
import Cookies from "js-cookie";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const logins = useFetchLogin();

  const handleLogin = async () => {
    const user = logins?.find((login) => login.username === username);
    console.log(password);
    if (user) {
      const isPasswordMatch = await compare(password, user.password);
      if (isPasswordMatch) {
        Cookies.set("user_id", user.id);
        Cookies.remove(user.id);
        router.push("/ad_service/manage");
      } else {
        alert("Username or password is incorrect");
      }
    } else {
      alert("Username or password is incorrect");
    }
  };
  const clicktoSignin = () => {
    router.push("/login_service/signin");
  };
  const clicktoChangepassword = () => {
    router.push("/login_service/acount_edit");
  };

  return (
    <>
      <Box>
        <Typography variant="h4" textAlign="center">
          Login
        </Typography>
        <Stack direction="column" spacing={1}>
          <TextField
            id="username"
            label="Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            id="password"
            label="Password"
            variant="outlined"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={handleLogin}>Login</Button>
          {/* <Typography
            sx={{
              textAlign: "center",
              "&:hover": {
                color: "blue",
                cursor: "pointer",
              },
            }}
            onClick={clicktoChangepassword}
          >
            Change password your account
          </Typography>
          <Typography
            sx={{
              textAlign: "center",
              "&:hover": {
                color: "blue",
                cursor: "pointer",
              },
            }}
            onClick={clicktoSignin}
          >
            Sign in
          </Typography> */}
        </Stack>
      </Box>
    </>
  );
};

export default Login;
