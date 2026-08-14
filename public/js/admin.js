const summaryEl = document.getElementById("summary");
const usersBody = document.querySelector("#users-table tbody");
const loansBody = document.querySelector("#loans-table tbody");
const refreshBtn = document.getElementById("refresh-btn");

function fmtXOF(n) {
  return n.toLocaleString("fr-FR") + " XOF";
}

function fmtDate(s) {
  if (!s) return "—";
  return s.replace("T", " ").slice(0, 16);
}

async function loadOverview() {
  const res = await fetch("/api/admin/overview");
  const data = await res.json();

  summaryEl.innerHTML = "";
  const cards = [
    ["Emprunteurs", data.summary.total_borrowers],
    ["Preteurs", data.summary.total_lenders],
    ["Prets actifs", data.summary.active_loans],
    ["Prets en retard", data.summary.late_loans],
    ["Frais collectes", fmtXOF(data.summary.total_fees_collected)],
  ];
  for (const [label, value] of cards) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="value">${value}</div><div class="label">${label}</div>`;
    summaryEl.appendChild(card);
  }

  usersBody.innerHTML = "";
  for (const u of data.users) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.name ?? "—"}</td>
      <td>${u.phone_number}</td>
      <td>${u.role ?? "—"}</td>
      <td>${u.kyc_status}</td>
      <td>${u.kyc_media_filename ? `<a href="/api/admin/kyc/${u.id}" target="_blank">Voir</a>` : "—"}</td>
      <td>${fmtDate(u.created_at)}</td>
    `;
    usersBody.appendChild(tr);
  }

  loansBody.innerHTML = "";
  for (const l of data.loans) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${l.id}</td>
      <td>${l.borrower_name ?? "—"}</td>
      <td>${l.lender_name ?? "—"}</td>
      <td>${fmtXOF(l.amount)}</td>
      <td><span class="status-pill status-${l.status}">${l.status}</span></td>
      <td>${fmtDate(l.requested_at)}</td>
      <td>${fmtDate(l.due_at)}</td>
    `;
    loansBody.appendChild(tr);
  }
}

refreshBtn.addEventListener("click", loadOverview);
loadOverview();
setInterval(loadOverview, 8000);
