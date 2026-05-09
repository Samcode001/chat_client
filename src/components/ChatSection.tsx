import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import type { Message } from "../types";
import { api } from "../lib/axios";
import ws from "../lib/socketInitiator";
import { updateConversation } from "../redux/conversationSlice";

const ChatSection = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsloading] = useState(false);
  const [cursorId, setCursorId] = useState(null);

  const cursorRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const dispatch = useDispatch();

  const focusedConversation = useSelector(
    (state: RootState) => state.conversation.focusedConversation,
  );

  const handleSubmit = async (e: any) => {
    try {
      e.preventDefault();
      const tempMessage: Message = {
        id: Date.now().toString(),
        content: chatInput,
        username: localStorage.getItem("currentUser")!,
        createdAt: Date.now().toString(),
      };
      setMessages((prev) => [...prev, tempMessage]);
      dispatch(
        updateConversation({
          id: focusedConversation?.id,
          lastMessage: chatInput,
        }),
      );
      ws.send(
        JSON.stringify({
          type: "message",
          payload: {
            content: chatInput,
            conversationId: focusedConversation?.id,
          },
        }),
      );
      const { data } = await api.post(
        `/chat/conversations/${focusedConversation?.id}/messages`,
        { content: chatInput },
      );
      console.log(data);

      setChatInput("");
    } catch (error) {
      console.log(error);
    }
  };

  const getConversationMessages = async () => {
    try {
      const query = cursorRef.current ? `?cursorId=${cursorRef.current}` : "";
      const { data } = await api.get(
        `/chat/conversations/${focusedConversation?.id}/messages${query}`,
      );
      // console.log(cursorId, data.cursorId);
      if (!data) return;
      // console.log(data);
      // if (!isActive) return;
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

  useEffect(() => {
    cursorRef.current = cursorId;
  }, [cursorId]);

  //responsible for the auto scroll of the caht section to bottom postion for new messages
  useEffect(() => {
    const el = scrollRef.current;

    if (!el) return;
    // console.log("messages", messages);
    requestAnimationFrame(() => {
      const isNearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 100;

      if (isNearBottom)
        el.scrollTo({
          top: el.scrollHeight,
          behavior: "smooth",
        });
    });
  }, [messages]);

  useEffect(() => {
    setIsloading(false);
    setMessages([]);
    setCursorId(null);
    // const el = scrollRef.current;
    // if (!el) return;

    getConversationMessages();

    // el.scrollTo({
    //   top: el.scrollHeight,
    //   behavior: "smooth",
    // });
    if (!ws) return;

    const handleSocketMessage = (event: MessageEvent) => {
      console.log("message recived", event.data);
      const data = JSON.parse(event.data);
      if (data.conversationId !== focusedConversation?.id) return;
      const tempMessage = {
        id: Date.now().toString(),
        content: data.content,
        username: data.username,
        createdAt: Date.now().toString(),
      };
      setMessages((prev) => [...prev, tempMessage]);
    };
    ws.addEventListener("message", handleSocketMessage);

    return () => {
      ws.removeEventListener("message", handleSocketMessage);
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
        <button style={{ margin: "auto", display: "block", cursor: "pointer" }}>
          Load older mssges.
        </button>
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
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
            ref={scrollRef}
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
                        key={message.id}
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

// btton cliked -> the cursoref should be hydarted witht the cursorid
//  -> when new response come ,store the newCursorId, in some toehr ref for late use in laodmore buttn
/*
ladMoreMessagesRef.current=dat.cursorId;
when button cliked ;
hydrate the cursoRef with the ladMoreMessagesRef;

*/
