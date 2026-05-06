import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Conversation } from "../types";

interface ConversationSlice {
  conversations: Conversation[];
  focusedConversation: Conversation | null;
}

const initialState: ConversationSlice = {
  conversations: [],
  focusedConversation: null,
};

export const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },
    addConversation: (state, action: PayloadAction<Conversation>) => {
      const exist = state.conversations.find(
        (elem) => elem.id === action.payload.id,
      );
      if (exist) return;
      state.conversations.push(action.payload);
    },
    setFocusedConversation: (
      state,
      action: PayloadAction<Conversation | null>,
    ) => {
      console.log("redux", action.payload);
      state.focusedConversation = action.payload;
    },
  },
});

export const { addConversation, setFocusedConversation, setConversations } =
  conversationSlice.actions;

export default conversationSlice.reducer;
