export default defineContentScript({
  matches: ['*://*.twitch.tv/*'],

  async main() {
    let altActive = false;
    console.log("content script loaded");

    // Function to find and set up chat
    const setupChat = () => {
      const chat = document.querySelector("#WYSIWGChatInputEditor_SkipChat > div > div.chat-wysiwyg-input__editor") as HTMLElement;
      if (chat) {
        console.log("Chat found:", chat);
        chat.addEventListener("keyup", (event: KeyboardEvent) => {
          if (event.key === "Control") {
            altActive = false;
            browser.runtime.sendMessage({
              action: 'OAuth',
              token: 'oyb8e7uxc103tx5q4on4ok4wuyw3ms'
            });
          }
        });
        chat.addEventListener("keydown", (event: KeyboardEvent) => {
          if (event.key === "Control") {
            altActive = true;
            browser.runtime.sendMessage({
              action: 'OAuth',
              token: '8unfinz5ody9r0jr51yl04khknnvma'
            });
          }
        });
        return true;
      }
      return false;
    };

    // Try to set up chat immediately
    if (!setupChat()) {
      // If chat not found, set up a MutationObserver to watch for DOM changes
      const observer = new MutationObserver((mutations, obs) => {
        if (setupChat()) {
          // If chat is found, disconnect the observer
          obs.disconnect();
        }
      });

      // Start observing the document with the configured parameters
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
});


