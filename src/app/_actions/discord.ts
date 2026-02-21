'use server';

// TODO: ensure this feature is disabled for now

/**
 * sendDiscordMessage sends a discord message through a webhook
 *
 * https://discord.com/developers/docs/resources/webhook#execute-webhook
 *
 * @param message
 * @returns a json response
 */
export const sendDiscordMessage = async (message: string) => {
  try {
    // A fetch request to send data through the discord
    // webhook, and display it as a message in your
    // discord channel
    const response = await fetch(process.env.DISCORD_WEBHOOK_URL as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: message
      })
    });

    return response;
  } catch (err: any) {
    // Just in case :)
    console.error(err.message);
    return err;
  }
};
