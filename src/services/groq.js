
const API_URL = "https://vitals-ai-chatbot-1.onrender.com/";

export async function sendMessage(history, currentMessage) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        history: history,
        message: currentMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.reply;

  } catch (error) {
    console.error("API Call Failed:", error);
    throw error;
  }
}
