// Lightweight module-level tracker for which chat room the user currently has
// open, so the notification hook can suppress toasts for the conversation that
// is already in view.
let openRoomId = null;

export const setOpenChatRoom = (id) => {
  openRoomId = id || null;
};

export const getOpenChatRoom = () => openRoomId;