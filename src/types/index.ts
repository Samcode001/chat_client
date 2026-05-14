export interface lastMessage {
  id: string;
  createdAt: string;
  content: string;
  sender: {
    id: string;
    username: string;
  };
}

export interface Conversation {
  id: string;
  username: string;
  lastMessage: string | null;
  updatedAt: string;
  isTyping?: boolean;
}
// interface MemberUser {
//   id: string;
//   username: string;
// }

// interface ConversationUser {
//   user: MemberUser;
// }

export interface Message {
  id: string;
  content: string;
  //   conversationId: string;
  createdAt: string;
  //   updatedAt: string;
  //   userId: string;
  username: string;
  status: string;
  seen: boolean;
  //   sender: {
  // id: string;
  //   };
}

export interface Cursor {
  [key: string]: string;
}
