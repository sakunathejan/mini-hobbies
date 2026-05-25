const KEY = "mini_hobbies_session";

export const getSessionId = () => {
  let sessionId = localStorage.getItem(KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(KEY, sessionId);
  }

  return sessionId;
};
