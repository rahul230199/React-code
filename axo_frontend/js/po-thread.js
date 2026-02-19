document.addEventListener("DOMContentLoaded", async () => {

  const token = localStorage.getItem("token");
  const params = new URLSearchParams(window.location.search);
  const poId = params.get("id");

  const res = await fetch(`/api/supplier/purchase-orders/${poId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const po = data.data.po;
  const milestones = data.data.milestones;

  document.getElementById("poHeader").innerHTML = `
    <h2>${po.po_number}</h2>
    <p>${po.part_name}</p>
    <p>Status: ${po.status}</p>
  `;

  const container = document.getElementById("timelineContainer");

  milestones.forEach(m => {
    const div = document.createElement("div");
    div.className = `timeline-step ${m.status}`;
    div.innerHTML = `<strong>${m.milestone_name}</strong>`;

    if (m.status !== "completed") {
      div.onclick = async () => {
        await fetch(`/api/supplier/purchase-orders/${poId}/milestones/${m.id}/update`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        location.reload();
      };
    }

    container.appendChild(div);
  });

});

