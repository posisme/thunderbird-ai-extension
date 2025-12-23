/**
 * Thunderbird WebExtension: Glados Email
 *
 * background.js
 * - Listens for messages from popup.js
 * - Fetches the selected message body
 * - Calls the AI endpoint
 */

// const AI_API_URL = "https://glados.inside.leepfrog.com/ollama/api/generate";

// Helper: read the plain text body of the selected message
async function getEmail() {
  // `browser.messages.getSelected` returns the id of the selected message.
  const ids = await messenger.messageDisplay.getDisplayedMessages();
  if (!ids || ids.length === 0) {
    throw new Error("No message selected");
  }
  const msgId = ids[0].id;
  

  // Get the raw body (plain or html). We’ll prefer plain if available.
  const parts = await messenger.messages.getFull(msgId);
  //console.log("P",parts);
  let plainBody = null;
  let htmlBody = null;

  // `parts.parts` is an array of message parts (MIME parts).
  // We’ll walk the tree to find text/plain and text/html.
  function walk(partsArray) {
    partsArray.forEach(part => {
      if (part.contentType === "text/plain" && !plainBody) {
        plainBody = part.body;
      } else if (part.contentType === "text/html" && !htmlBody) {
        htmlBody = part.body;
      }
      if (part.parts) {
        walk(part.parts);
      }
    });
  }
  walk(parts.parts);
  
  if (plainBody) return plainBody;
  if (htmlBody) {
    // Strip tags for a quick plain text fallback
    const div = document.createElement("div");
    div.innerHTML = htmlBody;
    return div.textContent || div.innerText || "";
  }
  throw new Error("Unable to find message body");
}

// Helper: call the AI endpoint
async function processAi(email,prompt, apipieces) {
  apiUrl = new URL(apipieces.apiUrl)
  const checkedUrl = `${apiUrl.protocol}//${apiUrl.host}${apiUrl.pathname}`;
  const apiUrlCall = `${checkedUrl}/chat/completions`;
  const uploadCall = `${checkedUrl}/v1/files/`;

  const fileBlob = new Blob([email],{type:"text/plain"});
  const formData = new FormData();
  formData.append('file',fileBlob,"email.txt");

  const upload = await fetch(uploadCall,{
    method:"POST",
    headers:{
      "Accept":"application/json",
      Authorization: `Bearer ${apipieces.apiKey}`
    },
    body:formData
  })
  const u = await upload.json();
  // console.log("U",u);
  const payload = {
    model: "llama3.2:latest",
    messages:[
      {"role":"user","content":prompt}
    ],
    files:[
      {"type":"file","id":u.id}
    ]
  };
  //console.log("Payload:",payload);
  const response = await fetch(apiUrlCall, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apipieces.apiKey}`
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error: ${response.status} ${errText}`);
  }
  
  const data = await response.json();
  // For chat completion, the first assistant message contains the reply.
  //console.log("D",data)
  return data.choices[0].message.content;
}

// Listener: popup.js will send `{action:"summarize"}` to get the summary.
browser.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.action !== "search") return;
  if(!msg.terms || msg.terms == "") {
    console.error("No terms to search");
    return { success: false, error: "No terms to search" }
  }
  const findtext = msg.terms;
  //console.log("F",findtext);
  try {
    // Retrieve stored API key
    const storagevars = ["apiKey","apiUrl"]
    const storage = await browser.storage.local.get(storagevars);
    storagevars.forEach((s)=>{
      if(!storage[s] || storage[s] == ""){
        throw new Error(`${s} not set.`)
      }
    })

    // Get the selected email body
    const email = await getEmail();

    // Get search terms
    const terms = storage

    // Call AI
    const found = await processAi(email, `Find this text:\n ${findtext} \nwithin the attached text and give a summary of what is requested about it`,storage);

    // Send back to popup
    return Promise.resolve({ success: true, summary:found });
  } catch (e) {
    console.error(e);
    return Promise.resolve({ success: false, error: e.message });
  }
});