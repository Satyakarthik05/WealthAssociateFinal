import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../data/ApiUrl";

let socket;

export const initializeSocket = async () => {
  const token = await AsyncStorage.getItem("authToken");

  socket = io(`${API_URL}`, {
    transports: ["websocket"],
    query: { token },
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized!");
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};
