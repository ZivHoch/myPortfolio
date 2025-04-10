const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export class ChatService {
  static async handleStreamingResponse(response, callbacks) {
    if (!response.body) {
      console.error("❌ No response body for stream.");
      throw new Error("Stream not supported.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullMessage = "";

    try {
      while (true) {
        if (callbacks.shouldStop?.()) {
          await reader.cancel();
          callbacks.onComplete(fullMessage);
          break;
        }

        const { done, value } = await reader.read();
        if (done) {
          callbacks.onComplete(fullMessage);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim() === "") continue;

          const match = line.match(/^0:(.+)$/);
          if (match) {
            try {
              const content = JSON.parse(match[1]);
              fullMessage += content;
              callbacks.onChunk(fullMessage);
              await new Promise((resolve) => setTimeout(resolve, 30));
            } catch (e) {
              console.error("❌ Error parsing JSON chunk:", e, line);
            }
          } else {
            console.warn("⚠️ Unexpected line format:", line);
          }
        }
      }
    } catch (e) {
      console.error("❌ Stream reading error:", e);
      throw new Error("Failed to process chat stream.");
    }
  }

  static async handleError(response) {
    let errorData;
    try {
      const text = await response.text();
      errorData = JSON.parse(text);
    } catch {
      errorData = { detail: "Unexpected error (HTML or non-JSON response)" };
    }

    if (response.status === 429) {
      return {
        isRateLimit: true,
        message: errorData.friendly_message || "You've hit the rate limit. Please wait before sending more messages.",
        retryAfter: errorData.retry_after,
      };
    }

    throw new Error(errorData.detail || "Failed to send message.");
  }

  static async sendMessage(chatRequest) {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...chatRequest,
        messages: chatRequest.messages.map(({ role, content }) => ({
          role,
          content,
        })),
      }),
    });

    if (!response.ok) {
      return this.handleError(response);
    }

    return response;
  }
}
