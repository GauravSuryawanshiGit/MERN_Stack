document.addEventListener("DOMContentLoaded", () => {
  const calBtn = document.getElementById("cal");
  const sendBtn = document.getElementById("sendBtn");

  let totalMonthly = 0;
  let totalDaily = 0;




  function calculateFootprint() {
    const family = parseFloat(document.getElementById("family_member").value) || 0;
    const electricity = parseFloat(document.getElementById("electricity").value) || 0;
    const petrol = parseFloat(document.getElementById("petrol").value) || 0;
    const diesel = parseFloat(document.getElementById("diesel").value) || 0;
    const meat = parseFloat(document.getElementById("meat").value) || 0;
    const gas = parseFloat(document.getElementById("gas").value) || 0;
    const garbage = parseFloat(document.getElementById("garbage").value) || 0;

    totalMonthly = (
      (family * 66) +
      (electricity * 0.5) +
      (petrol * 2.3) +
      (diesel * 2.7) +
      (meat * 27) +
      (gas * 2.3) +
      (garbage * 0.5)
    ).toFixed(2);

    totalDaily = (totalMonthly / 30).toFixed(2);

    document.getElementById("result-monthly").textContent = totalMonthly;
    document.getElementById("result-daily").textContent = totalDaily;
  }


  calBtn.addEventListener("click", calculateFootprint);




  sendBtn.addEventListener("click", async () => {
    if (!totalMonthly || !totalDaily) {
      document.getElementById("output").textContent =
        "⚠️ Please calculate your footprint first.";
      return;
    }

    document.getElementById("output").innerHTML =
      "<em>Getting suggestions...</em>";

    try {
      const res = await fetch("/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daily: totalDaily,
          monthly: totalMonthly
        })
      });

      if (!res.ok) throw new Error("Failed request");

      const data = await res.json();

      document.getElementById("output").innerHTML =
        formatTextResponse(data.suggestions);




      await fetch("/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculation: `Monthly: ${totalMonthly} kg CO₂ | Daily: ${totalDaily} kg CO₂`,
          suggestion: data.suggestions
        })
      });

    } catch (error) {
      console.error("Error:", error);
      document.getElementById("output").textContent =
        "❌ Failed to load suggestions.";
    }
  });




  function formatTextResponse(text) {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/- (.*?)\n/g, "<li>$1</li>")
      .replace(/\n{2,}/g, "<br>");

    if (formatted.includes("<li>")) {
      formatted = `<ul>${formatted}</ul>`;
    }
    return formatted;
  }
});
