import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import type { Message } from "../types";
import { api } from "../lib/axios";

const ChatSection = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsloading] = useState(false);
  const [cursorId, setCursorId] = useState(null);

  // const messageRef = useRef<Message[]>([]);

  const focusedConversation = useSelector(
    (state: RootState) => state.conversation.focusedConversation,
  );

  const handleSubmit = async (e: any) => {
    try {
      e.preventDefault();
      const tempMessage: Message = {
        id: Date.now().toString(),
        content: chatInput,
        createdAt: Date.now().toString(),
        username: localStorage.getItem("token")!,
      };

      setMessages((prev) => [...prev, tempMessage]);
      const { data } = await api.post(
        `/chat/conversations/${focusedConversation?.id}/messages`,
        { content: chatInput },
      );
      console.log(data);

      setChatInput("");
      //   getConversationMessages();
    } catch (error) {
      console.log(error);
    }
  };

  // useEffect(() => {
  //   messageRef.current = messages;
  //   return () => {
  //     messageRef.current = [];
  //   };
  // }, [messages]);

  useEffect(() => {
    setIsloading(false);
    setMessages([]);
    setCursorId(null);

    let isActive = true; // to avoid race condition for api resolving in interval

    const getConversationMessages = async () => {
      try {
        const { data } = await api.get(
          `/chat/conversations/${focusedConversation?.id}/messages?${cursorId ? `cursorId=${cursorId}` : ""}`,
        );
        // console.log(cursorId, data.cursorId);
        // if (!data) return;
        // console.log(data);
        if (!isActive) return;
        setCursorId(data.cursorId);
        setIsloading(true);

        setMessages((prev) => {
          const newMessages = data.messages;
          const ids = new Set(prev.map((msg) => msg.id));

          const merged = [...prev];

          newMessages.map((msg: Message) => {
            if (!ids.has(msg.id)) merged.push(msg);
          });

          return merged;
        });
      } catch (error) {
        console.log(error);
      }
    };

    getConversationMessages();
    const interval = setInterval(getConversationMessages, 2500);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [focusedConversation?.id]);

  return (
    <>
      <div
        style={{
          //   display: "flex",
          //   justifyContent: "center",
          //   alignItems: "center",
          //   backgroundColor: "lime",
          width: "60vw",
          height: "92vh",
          position: "relative",
          padding: "1rem",
        }}
      >
        <h2>{focusedConversation?.username}</h2>
        <hr />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10",
            alignContent: "space-between",
          }}
        >
          <div
            style={{
              //   display: "flex",
              justifyContent: "center",
              alignItems: "center",
              //   backgroundColor: "violet",
              height: "70vh",
              position: "relative",
              padding: "1rem",
              overflowY: "scroll",
            }}
          >
            {isLoading
              ? messages.length !== 0
                ? messages.map((message) => {
                    return (
                      <div
                        style={
                          message.username !==
                          localStorage.getItem("currentUser")
                            ? { textAlign: "left", marginBottom: "1rem" }
                            : { textAlign: "right", marginBottom: "1rem" }
                        }
                      >
                        <span
                          style={{
                            fontSize: "0.8rem",
                            display: "block",
                            textDecoration: "underline",
                            marginBottom: "4px",
                            color: "gray",
                          }}
                        >
                          {message.username}
                        </span>
                        <span style={{ fontSize: "1.2rem" }}>
                          {message.content}
                        </span>
                      </div>
                    );
                  })
                : "Start The Conversation."
              : "Loading ..."}
            {/* {JSON.stringify(messages)} */}
          </div>

          <form
            style={{
              display: "flex",
              //   width: "inherit",
              //   outline: "1px solid blue",
              gap: "12px",
              padding: "2px 15px",
              //   position: "absolute",
              //   bottom: "30px",
              //   left: "0",
            }}
            onSubmit={handleSubmit}
          >
            <div
              style={{
                width: "20px",
                textAlign: "center",
                outline: "1px solid gray",
              }}
            >
              +
            </div>
            <input
              style={{ flex: "1", fontSize: "1.2rem" }}
              placeholder="Write Something..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button style={{ width: "50px" }}>send</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChatSection;
