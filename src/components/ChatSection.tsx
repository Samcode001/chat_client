import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import type { Cursor, Message } from "../types";
import { api } from "../lib/axios";
// import ws from "../lib/socketInitiator";
import { updateConversation } from "../redux/conversationSlice";
import { socketManager } from "../lib/socketInitiator";

const ChatSection = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsloading] = useState(false);
  const [cursorId, setCursorId] = useState(null);
  const [isTypingFlag, setIsTypingFlag] = useState(false);
  // const [isMessageSentFlag, setIsMessageSentFlag] = useState(false);

  const cursorRef = useRef<Cursor>({});
  const LoadMoreRef = useRef<boolean>(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const typingDebounceTimer = useRef<number>(NaN);

  const dispatch = useDispatch();

  const ws = socketManager.getSocket();

  const focusedConversation = useSelector(
    (state: RootState) => state.conversation.focusedConversation,
  );

  const handleSubmit = async (e: any) => {
    try {
      e.preventDefault();

      // this is called Optimistic Update
      const tempId = `temp-${Date.now().toString()}`;
      const tempMessage: Message = {
        id: tempId,
        content: chatInput,
        username: localStorage.getItem("currentUser")!,
        createdAt: Date.now().toString(),
        status: "sending",
        seen: false,
      };
      setMessages((prev) => [...prev, tempMessage]);
      dispatch(
        updateConversation({
          type: "messageUpdate",
          payload: {
            id: focusedConversation?.id,
            lastMessage: chatInput,
          },
        }),
      );

      socketManager.sendMessage({
        type: "message",
        payload: {
          tempMessageId: tempId,
          content: chatInput,
          conversationId: focusedConversation?.id!,
        },
      });

      setChatInput("");
    } catch (error) {
      console.log(error);
    }
  };

  const getConversationMessages = async () => {
    try {
      if (!focusedConversation?.id) return;
      const conversationId = focusedConversation.id as string;
      const query =
        cursorRef.current[conversationId] && LoadMoreRef.current
          ? `?cursorId=${cursorRef.current[conversationId]}`
          : "";
      const { data } = await api.get(
        `/chat/conversations/${conversationId}/messages${query}`,
      );
      if (!data) return;
      setCursorId(data.cursorId);
      setIsloading(true);

      setMessages((prev) => {
        const newMessages = data.messages;
        const ids = new Set(prev.map((msg) => msg.id));

        // newMessages.filter(msg=>msg.id)
        const filteredMssgs = newMessages.filter((msg: Message) => {
          if (!ids.has(msg.id)) return msg;
        });
        const merged = [...filteredMssgs, ...prev];

        return merged;
      });
      LoadMoreRef.current = false;
    } catch (error) {
      console.log(error);
    }
  };

  const handleTypingIndicator = async (flag: boolean) => {
    socketManager.sendMessage({
      type: "typing",
      payload: {
        conversationId: focusedConversation?.id!,
        username: localStorage.getItem("currentUser")!,
        indicatorFlag: flag,
      },
    });
  };

  useEffect(() => {
    let conversationId = focusedConversation?.id! as string;
    if (!cursorId) return;
    cursorRef.current[conversationId] = cursorId;
  }, [cursorId]);

  //responsible for the auto scroll of the chat section to bottom postion for new messages
  useEffect(() => {
    const el = scrollRef.current;

    if (!el) return;
    // console.log("istypingFLag", isTypingFlag);
    requestAnimationFrame(() => {
      const isNearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 100;

      if (isNearBottom)
        el.scrollTo({
          top: el.scrollHeight,
          behavior: "smooth",
        });
    });
  }, [messages, isTypingFlag]);

  useEffect(() => {
    setIsloading(false);
    setMessages([]);
    setCursorId(null);
    const el = scrollRef.current;
    if (!el) return;
    (async () => {
      await getConversationMessages();
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    })();
  }, [focusedConversation?.id]);

  useEffect(() => {
    if (!ws) return;

    // Responsible for Incoming adding message from socket server
    const handleAddMessage = (data: {
      conversationId: string;
      tempMessageId: string;
      id: string;
      content: string;
      username: string;
      createdAt: string;
      status: string;
      seen: boolean;
    }) => {
      if (data.conversationId !== focusedConversation?.id) return;

      const backendResponseMessage = {
        id: data.id,
        content: data.content,
        username: data.username,
        createdAt: Date.now().toString(),
        status: data.status,
        seen: data.seen,
      };
      setMessages((prev) => {
        let copy = [...prev];
        let tempIndex = copy.findIndex(
          (elem) => elem.id === data.tempMessageId,
        );

        if (tempIndex !== -1) copy.splice(tempIndex, 1);

        return [...copy, backendResponseMessage];
      });
      if (localStorage.getItem("currentUser") !== data.username)
        socketManager.sendMessage({
          type: "delivered",
          payload: {
            messageId: data.id,
            username: data.username,
            conversationId: data.conversationId,
          },
        });
      // setIsMessageSentFlag(true);
    };

    const handleAddDeliveredStatus = (data: {
      messageId: string;
      status: string;
    }) => {
      setMessages((prev) => {
        const cloned = [...prev];

        let updateMessageIndex = cloned.findIndex(
          (elem) => elem.id === data.messageId,
        );
        cloned[updateMessageIndex].status = data.status;
        return cloned;
      });
    };

    // responsible for adding incoming typing indicator in chat secton
    const handleAddTypingIndicator = (data: {
      conversationId: string;
      username: string;
      indicatorFlag: boolean;
    }) => {
      // console.log("incoming typing mssg", data);
      if (focusedConversation?.id === data.conversationId)
        setIsTypingFlag(data.indicatorFlag);
    };

    const handleSocketMessage = (event: MessageEvent) => {
      console.log("message recived", event.data);
      let data = JSON.parse(event.data);

      switch (data.type) {
        case "message":
          handleAddMessage(data.payload);
          break;
        case "typing":
          handleAddTypingIndicator(data.payload);
          break;
        case "delivered":
          handleAddDeliveredStatus(data.payload);
      }
    };
    ws.addEventListener("message", handleSocketMessage);

    return () => {
      ws.removeEventListener("message", handleSocketMessage);
      clearTimeout(typingDebounceTimer.current);
    };
  }, []);

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
        <button
          style={{ margin: "auto", display: "block", cursor: "pointer" }}
          onClick={() => {
            LoadMoreRef.current = true;
            getConversationMessages();
          }}
        >
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
                            fontSize: "1rem",
                            display: "block",
                            textDecoration: "underline",
                            marginBottom: "4px",
                            color: "gray",
                          }}
                        >
                          {/* {message.username} */}
                        </span>
                        <span style={{ fontSize: "1.2rem" }}>
                          {message.content}
                        </span>
                        {message.username ===
                        localStorage.getItem("currentUser") ? (
                          <span
                            style={
                              message.seen
                                ? {
                                    fontSize: "0.7rem",
                                    color: "blue",
                                    paddingLeft: "2px",
                                  }
                                : {
                                    fontSize: "0.7rem",
                                    color: "gray",
                                    paddingLeft: "2px",
                                  }
                            }
                          >
                            {message.status === "sent" ? <span> ✓</span> : ""}
                            {message.status === "delivered" ? (
                              <span> ✓✓</span>
                            ) : (
                              ""
                            )}
                          </span>
                        ) : (
                          ""
                        )}
                      </div>
                    );
                  })
                : "Start The Conversation."
              : "Loading ..."}
            {/* {JSON.stringify(messages)} */}
            {isTypingFlag ? (
              <span style={{ fontSize: "1.2rem", fontWeight: "bolder" }}>
                typing...
              </span>
            ) : (
              ""
            )}
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
              // The Debouncing method for the typing event
              onChange={(e) => {
                setChatInput(e.target.value);
                handleTypingIndicator(true);

                clearTimeout(typingDebounceTimer.current);

                typingDebounceTimer.current = setTimeout(() => {
                  handleTypingIndicator(false);
                }, 1500);
              }}
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
