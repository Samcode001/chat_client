import { useEffect, useState } from "react";
// import { useDispatch } from "react-redux";
// import { addConversation } from "../redux/conversationSlice";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/axios";

// let data = [
//   {
//     id: 1,
//     username: "sam",
//   },
//   {
//     id: 2,
//     username: "jai",
//   },
//   {
//     id: 3,
//     username: "him",
//   },
//   {
//     id: 4,
//     username: "dee",
//   },
// ];

interface User {
  id: string;
  username: string;
}
const AddUser = () => {
  const [usersList, setusersList] = useState<User[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [cursorId, setCursorId] = useState(null);

  //   const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSearchSubmit = (e: any) => {
    try {
      e.preventDefault();

      setSearchInput("");
    } catch (error) {}
  };

  const getUsers = async () => {
    const { data } = await api.get(
      `/user/getusers?${cursorId ? cursorId : ""}`,
    );

    console.log(data);
    setusersList(data.users);
    setCursorId(data.cursorId);
  };

  const handleCreateConversation = async (user: User) => {
    try {
      const { data } = await api.post("/chat/conversations", {
        memberIds: [user.id],
      });
      console.log(data);
      //   dispatch(addConversation(data.conversation));
      if (!data) {
        console.log("Error on making conversation;");
        return;
      }
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getUsers();

    return () => {
      //   second
    };
  }, []);

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "3rem",
          flexDirection: "column",
          //   justifyContent: "center",
          alignItems: "center",
          //   alignContent:"space-around",
          //   width: "100%",
          height: "80vh",
          outline: "1px solid red",
          padding: "2rem",
        }}
      >
        <form onSubmit={handleSearchSubmit}>
          <input
            placeholder="Search User..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              fontSize: "1.3rem",
              background: "transparent",
              color: "whitesmoke",
            }}
          />
          <button
            style={{
              fontSize: "1.3rem",
              background: "transparent",
              color: "whitesmoke",
              outline: "1px solid gray",
            }}
          >
            Find
          </button>
        </form>
        <div>
          {usersList.map((user) => {
            return (
              <div
                key={user.id}
                style={{
                  outline: "1px solid gray",
                  width: "60vw",
                  textAlign: "center",
                  margin: "0.8rem 0",
                  padding: "10px 4px",
                  cursor: "pointer",
                }}
                onClick={() => handleCreateConversation(user)}
              >
                <span>{user.username}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default AddUser;
