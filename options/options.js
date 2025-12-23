$(function(){

// Load stored API key on startup
browser.storage.local.get("apiKey").then((data) => {
  if (data.apiKey) {
    $("#api-key").val(data.apiKey);
    //apiKeyInput.value = data.apiKey;
  }
});
browser.storage.local.get("apiUrl").then((data) => {
  if (data.apiUrl) {
    $("#api-url").val(data.apiUrl);
    //apiKeyInput.value = data.apiKey;
  }
});
$("#save-key").click(() => {
  const key = $("#api-key").val().trim();
  let errstatus = [];
  if (!key) {
    errstatus.push("API key cannot be empty")
  }
  const url = $("#api-url").val().trim();
  if(!url){
    errstatus.push("URL cannot be empty")
  }
  if(errstatus && errstatus.length > 0){
    $("#status").addClass("error").append(errstatus);
    return;
  }
  browser.storage.local.set({ apiKey: key }).then(()=>{
    console.log("apiKey set");
  },(err)=>{
    console.log(err)
  });
  browser.storage.local.set({ apiUrl: url }).then(()=>{
    console.log("apiUrl set");
  },(err)=>{
    console.log(err)
  });;
  $("#status").empty().append("Saved");
})
});
