const ENDPOINT = "/api/chat";

export async function sendMessage(history, newMessage) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      history: history.map((m) => ({ role: m.role, text: m.text })),
      message: newMessage,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  if (!data.reply) {
    throw new Error("No response from model");
  }

  return data.reply;
}
