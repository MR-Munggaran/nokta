export async function sendDiscordNotification(payload: unknown) {
  try {
    await fetch(process.env.DISCORD_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Discord webhook error:", error);
  }
}