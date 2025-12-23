$(function(){

// Summarize button
$("#search").click(async () => {
  $("#status").empty().append("Searching...");
  try {
    // Let background do the heavy lifting
    const result = await browser.runtime.sendMessage({ action: "search", terms: $("#searchterms").val() });

    if (result.success) {
      $("#output").text(result.summary);
      $("#status").empty();
    } else {
      $("#status").append("error").addClass("error");
      throw new Error(result.error);
      
    }
  } catch (e) {
    $("#status").append("error").addClass("error");
    
  }
})
})