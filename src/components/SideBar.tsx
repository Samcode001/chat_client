import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Conversation } from "../types";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  setFocusedConversation,
} from "../redux/conversationSlice";
import type { RootState } from "../redux/store";
import { api } from "../lib/axios";

const SideBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);

  const conversations = useSelector(
    (state: RootState) => state.conversation.conversations,
  );

  const getConversations = async () => {
    try {
      const { data } = await api.get(`/chat/conversations`);

      console.log(data);
      if (!data) return;
      setIsLoading(true);
      dispatch(setConversations(data.conversations));
      //   setConversation(data.conversations);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    dispatch(setFocusedConversation(conversation));
  };
  useEffect(() => {
    getConversations();
  }, []);

  return (
    <>
      <div
        style={{
          width: "30vw",
          height: "95vh",
          //   display: "flex",
          justifyContent: "center",
          alignItems: "center",
          outline: "2px solid gray",

          //   backgroundColor: "red",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          <h2>Conversations</h2>
          <span
            style={{
              fontSize: "1.8rem",
              fontWeight: "bolder",
              cursor: "pointer",
            }}
            onClick={() => {
              navigate("/adduser");
            }}
          >
            +
          </span>
        </div>
        <hr />

        <div>
          {/* <span style={{ display: "block", margin: "4px 0px" }}>jogy</span>

          <span>message ....</span> */}
          {isLoading
            ? conversations.length > 0
              ? conversations.map((conversation) => {
                  return (
                    <div
                      style={{
                        outline: "1px solid gray",
                        padding: " 4px 10px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleSelectConversation(conversation)}
                    >
                      <span
                        style={{
                          // display: "block",
                          margin: "4px 0px",
                          fontSize: "1.1rem",
                          color: "gray",
                        }}
                      >
                        {conversation.username}
                      </span>
                      <div style={{ display: "flex", fontSize: "0.9rem" }}>
                        {/* <span>{conversation.sender}</span> : */}
                        <span>
                          {conversation.lastMessage
                            ? conversation.lastMessage
                            : ""}
                        </span>
                      </div>
                    </div>
                  );
                })
              : "No Conversations yet"
            : "Loading ..."}
        </div>
      </div>
    </>
  );
};

export default SideBar;
