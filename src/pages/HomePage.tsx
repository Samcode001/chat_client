// import React from "react";

import { useSelector } from "react-redux";
import ChatSection from "../components/ChatSection";
import SideBar from "../components/SideBar";
import type { RootState } from "../redux/store";

const HomePage = () => {
  const focusedConversation = useSelector(
    (state: RootState) => state.conversation.focusedConversation,
  );
  return (
    <>
      <div style={{ display: "flex" }}>
        <SideBar />
        {focusedConversation?.id ? (
          <ChatSection />
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "right",
              alignItems: "center",
            }}
          >
            <h1 style={{ textAlign: "center" }}>Select a conversation</h1>
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;
