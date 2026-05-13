import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Conversation } from "../types";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  setFocusedConversation,
  updateConversation,
} from "../redux/conversationSlice";
import type { RootState } from "../redux/store";
import { api } from "../lib/axios";
import { socketManager } from "../lib/socketInitiator";
// import ws from "../lib/socketInitiator";

const SideBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const ws = socketManager.getSocket();

  const [isLoading, setIsLoading] = useState(false);

  const conversations = useSelector(
    (state: RootState) => state.conversation.conversations,
  );

  const getConversations = async () => {
    try {
      const { data } = await api.get(`/chat/conversations`);

      console.log(data);

      if (!data) return;
      let conversations = data.conversations;
      setIsLoading(true);
      dispatch(setConversations(conversations));

      conversations.map((conversation: Conversation) => {
        socketManager.sendMessage({
          type: "join",
          payload: {
            conversationId: conversation.id,
            username: localStorage.getItem("currentUser")!,
            token: localStorage.getItem("token")!,
          },
        });
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    dispatch(setFocusedConversation(conversation));
  };

  useEffect(() => {
    if (!ws) return;

    console.log("conversations", conversations);

    // const handleConnectionOpen = () => {
    //   console.log("connected to socket server");
    // };

    // const handleSocketError = (error: any) => {
    //   console.log("error on socket", error);
    // };

    // responsible for adding the lastmessage get from socket server in sidebar
    const handleAddMessage = (data: any) => {
      const conversationId = data.conversationId;
      dispatch(
        updateConversation({
          type: "messageUpdate",
          payload: { id: conversationId, lastMessage: data.content },
        }),
      );
    };
    // responsilbe for adding typing incator from socket server in  sidebar
    const handleAddTypingIndicator = (data: {
      conversationId: string;
      username: string;
      indicatorFlag: boolean;
    }) => {
      // console.log(data);
      dispatch(
        updateConversation({
          type: "typingIndicatorUpdate",
          payload: {
            id: data.conversationId,
            indicatorFlag: data.indicatorFlag,
          },
        }),
      );
    };

    const handleSocketMessage = (event: MessageEvent) => {
      let data = JSON.parse(event.data);

      switch (data.type) {
        case "message":
          handleAddMessage(data.payload);
          break;
        case "typing":
          handleAddTypingIndicator(data.payload);
      }
    };

    // const handleConnectionClose = () => {
    //   console.log("close called");
    //   // ConnectSocket();
    // };
    ws.addEventListener("message", handleSocketMessage);
    // ws.addEventListener("open", handleConnectionOpen);
    // ws.addEventListener("error", handleSocketError);
    // ws.addEventListener("close", handleConnectionClose);

    return () => {
      ws.removeEventListener("message", handleSocketMessage);
      // ws.removeEventListener("open", handleConnectionOpen);
      // ws.removeEventListener("error", handleSocketError);
      // ws.removeEventListener("close", handleConnectionClose);
    };
  }, []);

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
                      key={conversation.id}
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
                          {conversation.isTyping
                            ? "typing..."
                            : conversation.lastMessage
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
