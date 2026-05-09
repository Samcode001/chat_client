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
      // console.log("redux", action.payload);
      state.focusedConversation = action.payload;
    },
    updateConversation: (state, action: PayloadAction<any>) => {
      const index = state.conversations.findIndex(
        (conversation) => conversation.id === action.payload.id,
      );
      // console.log(action.payload, state.conversations[index]);

      state.conversations[index].lastMessage = action.payload.lastMessage;

      let temp = state.conversations[index];
      state.conversations[index] = state.conversations[0];
      state.conversations[0] = temp;
    },
  },
});

export const {
  addConversation,
  setFocusedConversation,
  setConversations,
  updateConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;
