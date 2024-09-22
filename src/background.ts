chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: "https://www.youtube.com" });
  });
  


  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "saveNotes") {
      chrome.storage.local.set({ notes: message.notes }, () => {
        sendResponse({ success: true });
      });
      return true; // Keep the message channel open for async response
    } else if (message.type === "getNotes") {
      chrome.storage.local.get("notes", (result) => {
        sendResponse({ notes: result.notes || [] });
      });
      return true; // Keep the message channel open for async response
    }
  });
  