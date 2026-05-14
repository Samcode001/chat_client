class SocketManager {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectCalls: number = 1;
  private ConversationsToConnect: string[] = [];

  connect() {
    if (
      this.socket &&
      (this.socket?.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    )
      return this.socket;

    this.socket = new WebSocket("ws://localhost:8080");

    this.socket.onopen = () => {
      console.log("SOCKET CONNECTED");
      this.joinAllConversations([]);
      this.reconnectCalls = 1;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.socket.onclose = () => {
      console.log("Socket DIsconnected");
      if (this.reconnectCalls > 16) return;
      this.reconnectTimer = setTimeout(() => {
        console.log("Socket Reconnecting...");
        this.connect();
      }, this.reconnectCalls * 1000);
      this.reconnectCalls = this.reconnectCalls * 2;
    };

    this.socket.onerror = (err) => {
      console.log(`Error On Socket ${err}`);
    };

    return this.socket;
  }

  getSocket() {
    if (!this.socket) this.connect();
    return this.socket;
  }

  joinAllConversations(data: string[]) {
    if (data.length > 0) this.ConversationsToConnect = data;

    this.ConversationsToConnect.map((conversationId) => {
      this.socket?.send(
        JSON.stringify({
          type: "join",
          payload: {
            conversationId: conversationId,
            username: localStorage.getItem("currentUser")!,
            token: localStorage.getItem("token")!,
          },
        }),
      );
    });
  }

  sendMessage(data: SendMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }
}

export const socketManager = new SocketManager();

type SendMessage = // Discriminated union
  | {
      type: "message";
      payload: MessagePayload;
    }
  | {
      type: "join";
      payload: JoinPayload;
    }
  | {
      type: "typing";
      payload: TypingPayload;
    }
  | {
      type: "delivered";
      payload: DeliveredPayload;
    };

interface MessagePayload {
  tempMessageId: string;
  content: string;
  conversationId: string;
}

interface TypingPayload {
  conversationId: string;
  username: string;
  indicatorFlag: boolean;
}

interface JoinPayload {
  conversationId: string;
  username: string;
  token: string;
}

interface DeliveredPayload {
  messageId: string;
  username: string;
  conversationId: string;
}
