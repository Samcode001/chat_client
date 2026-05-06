import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const navigate = useNavigate();
  const handleSubmit = async (e: any) => {
    try {
      localStorage.setItem("currentUser", formData.username);
      e.preventDefault();
      const { data } = await axios.post(
        "http://localhost:3000/api/user/signin",
        {
          ...formData,
        },
      );
      console.log(data);
      if (!data) return;
      const { token } = data;
      localStorage.setItem("token", token);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit}>
        <h1>SignIn</h1>
        <input
          placeholder="username"
          value={formData.username}
          onChange={(e) =>
            setFormData((prev) => {
              return { ...prev, username: e.target.value };
            })
          }
        />
        <input
          placeholder="password"
          value={formData.password}
          onChange={(e) => {
            setFormData((prev) => {
              return { ...prev, password: e.target.value };
            });
          }}
        />
        <button>Submit</button>
      </form>
    </>
  );
};

export default SignIn;
