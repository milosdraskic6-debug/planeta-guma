// =============================================================
//  ADMIN STRANA: upiti kupaca, gume i artikli prodavnice
//  Pristup imaju samo nalozi upisani u tabelu "admini" u bazi.
// =============================================================

const el = (id) => document.getElementById(id);
let aktivniTab = "upiti";
let podaci = { upiti: [], gume: [], proizvodi: [] };

const TIP_UPITA = { rezervacija: "Rezervacija gume", dostupnost: "Provera / pitanje", porudzbina: "Porudžbina" };
const STATUSI = ["novo", "u obradi", "zavrseno", "otkazano"];
const NAZIV_STATUSA = { novo: "Novo", "u obradi": "U obradi", zavrseno: "Završeno", otkazano: "Otkazano" };

// Polja u prozoru za dodavanje/izmenu
const POLJA = {
  gume: [
    ["proizvodjac", "Proizvođač", "text", { required: true }],
    ["model", "Model", "text", { required: true }],
    ["sirina", "Širina (npr. 205)", "number", { required: true, min: 100, max: 400 }],
    ["visina", "Visina (npr. 55)", "number", { required: true, min: 20, max: 100 }],
    ["precnik", "Prečnik R (npr. 16)", "number", { required: true, min: 10, max: 30 }],
    ["sezona", "Sezona", "select", { opcije: [["letnja", "Letnja"], ["zimska", "Zimska"], ["sve sezone", "Sve sezone"]] }],
    ["tip", "Vozilo", "select", { opcije: [["auto", "Putničko"], ["4x4", "Džip 4x4"], ["kombi", "Kombi"], ["kamion", "Kamion"], ["moto", "Motor"]] }],
    ["indeks", "Indeks nosivosti/brzine (npr. 91V)", "text", {}],
    ["cena", "Cena po komadu (din)", "number", { min: 0, step: 1 }],
    ["kolicina", "Količina na stanju", "number", { required: true, min: 0 }],
    ["slika_url", "Link do slike", "url", {}],
    ["opis", "Opis", "textarea", {}],
  ],
  proizvodi: [
    ["kategorija", "Kategorija", "select", { opcije: [["ulja", "Ulja i filteri"], ["akumulatori", "Akumulatori"], ["felne", "Felne"], ["delovi", "Delovi"], ["oprema", "Oprema"], ["usluge", "Usluge"]] }],
    ["naziv", "Naziv", "text", { required: true }],
    ["cena", "Cena (din), prazno = cena na upit", "number", { min: 0, step: 1 }],
    ["slika_url", "Link do slike", "url", {}],
    ["opis", "Opis", "textarea", {}],
  ],
};

// ---------- Prijava ----------
async function proveriPrijavu() {
  const { data: { session } } = await baza.auth.getSession();
  if (!session) {
    el("prijava").hidden = false; el("radno").hidden = true; el("odjava").hidden = true;
    return;
  }
  const { data: jeAdmin } = await baza.rpc("je_admin");
  el("prijava").hidden = true;
  el("odjava").hidden = false;
  if (!jeAdmin) {
    el("radno").hidden = false;
    el("sadrzaj").innerHTML = `<div class="poruka-greska">Prijavljeni ste, ali ovaj nalog još nema admin pristup. Pošaljite ovaj broj osobi koja održava sajt: <code>${esc(session.user.id)}</code></div>`;
    document.querySelector(".tabovi").hidden = true;
    return;
  }
  document.querySelector(".tabovi").hidden = false;
  el("radno").hidden = false;
  await ucitajSve();
}

el("prijava").addEventListener("submit", async (e) => {
  e.preventDefault();
  el("a-status").innerHTML = "";
  const { error } = await baza.auth.signInWithPassword({
    email: el("a-email").value.trim(),
    password: el("a-lozinka").value,
  });
  if (error) {
    el("a-status").innerHTML = `<div class="poruka-greska">Pogrešan email ili lozinka.</div>`;
    return;
  }
  proveriPrijavu();
});

el("odjava").addEventListener("click", async () => { await baza.auth.signOut(); proveriPrijavu(); });

// ---------- Učitavanje ----------
async function ucitajSve() {
  const [u, g, p] = await Promise.all([
    baza.from("upiti").select("*").order("created_at", { ascending: false }).limit(300),
    baza.from("gume").select("*").order("proizvodjac").order("sirina").order("visina").order("precnik"),
    baza.from("proizvodi").select("*").order("kategorija").order("naziv"),
  ]);
  if (u.error || g.error || p.error) {
    el("sadrzaj").innerHTML = `<div class="poruka-greska">Podaci nisu učitani. Proverite internet i kliknite Osveži.</div>`;
    return;
  }
  podaci = { upiti: u.data, gume: g.data, proizvodi: p.data };
  const novih = podaci.upiti.filter((x) => x.status === "novo").length;
  el("broj-novih").hidden = novih === 0;
  el("broj-novih").textContent = novih;
  nacrtaj();
}

function nacrtaj() {
  document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.tab === aktivniTab));
  if (aktivniTab === "upiti") nacrtajUpite();
  if (aktivniTab === "gume") nacrtajGume();
  if (aktivniTab === "proizvodi") nacrtajProizvode();
}

document.querySelector(".tabovi").addEventListener("click", (e) => {
  const t = e.target.closest("[data-tab]");
  if (t) { aktivniTab = t.dataset.tab; nacrtaj(); }
});
el("osvezi").addEventListener("click", ucitajSve);

// ---------- Upiti ----------
function nacrtajUpite() {
  if (!podaci.upiti.length) {
    el("sadrzaj").innerHTML = `<div class="prazno"><h3>Još nema upita</h3><p>Kad kupac rezerviše gumu, pošalje porudžbinu ili pitanje, pojaviće se ovde.</p></div>`;
    return;
  }
  const redovi = podaci.upiti.map((u) => {
    const datum = new Date(u.created_at).toLocaleString("sr-RS", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const stavke = (u.stavke || []).map((s) => `${s.kolicina} × ${esc(s.naziv)}${s.cena ? ` (${esc(cena(s.cena))})` : ""}`).join("<br>");
    const opcije = STATUSI.map((s) => `<option value="${s}"${s === u.status ? " selected" : ""}>${NAZIV_STATUSA[s]}</option>`).join("");
    return `
      <tr>
        <td>${esc(datum)}</td>
        <td class="${u.status === "novo" ? "status-novo" : ""}">${esc(TIP_UPITA[u.tip] || u.tip)}</td>
        <td>${esc(u.ime)}<br><a href="tel:${esc(u.telefon.replace(/\s/g, ""))}">${esc(u.telefon)}</a>${u.email ? `<br>${esc(u.email)}` : ""}</td>
        <td>${stavke}</td>
        <td>${esc(u.lokacija || "")}</td>
        <td>${esc(u.poruka || "")}</td>
        <td><select data-status="${u.id}">${opcije}</select></td>
        <td><button class="dugme dugme-okvir dugme-malo" data-obrisi="upiti:${u.id}">Obriši</button></td>
      </tr>`;
  }).join("");
  el("sadrzaj").innerHTML = `
    <div class="tabela-omotac"><table>
      <thead><tr><th>Vreme</th><th>Vrsta</th><th>Kupac</th><th>Šta traži</th><th>Lokacija</th><th>Napomena</th><th>Status</th><th></th></tr></thead>
      <tbody>${redovi}</tbody>
    </table></div>`;
}

el("sadrzaj").addEventListener("change", async (e) => {
  const s = e.target.closest("[data-status]");
  if (s) {
    const { error } = await baza.from("upiti").update({ status: s.value }).eq("id", s.dataset.status);
    if (error) alert("Status nije sačuvan.");
    else ucitajSve();
    return;
  }
  // Brza izmena cene, količine i statusa direktno u tabeli
  const b = e.target.closest("[data-brzo]");
  if (b) {
    const [tabela, id, polje] = b.dataset.brzo.split(":");
    let vrednost = b.type === "checkbox" ? b.checked : b.value;
    if (b.type === "number") vrednost = b.value === "" ? null : Number(b.value);
    const { error } = await baza.from(tabela).update({ [polje]: vrednost }).eq("id", id);
    b.style.outline = error ? "2px solid var(--crvena)" : "2px solid var(--zelena)";
    setTimeout(() => { b.style.outline = ""; }, 1200);
    if (!error) {
      const red = podaci[tabela].find((x) => x.id == id);
      if (red) red[polje] = vrednost;
    }
  }
});

// ---------- Gume ----------
function nacrtajGume() {
  const redovi = podaci.gume.map((g) => `
    <tr class="${g.aktivan ? "" : "neaktivan"}">
      <td><strong>${g.sirina}/${g.visina} R${g.precnik}</strong></td>
      <td>${esc(g.proizvodjac)} ${esc(g.model)}${g.indeks ? ` ${esc(g.indeks)}` : ""}</td>
      <td>${esc(g.sezona)}</td>
      <td><input class="mali" type="number" min="0" value="${g.cena ?? ""}" data-brzo="gume:${g.id}:cena" aria-label="Cena"></td>
      <td><input class="mali" type="number" min="0" value="${g.kolicina}" data-brzo="gume:${g.id}:kolicina" aria-label="Količina"></td>
      <td><input type="checkbox" ${g.aktivan ? "checked" : ""} data-brzo="gume:${g.id}:aktivan" aria-label="Prikaži na sajtu"></td>
      <td><button class="dugme dugme-okvir dugme-malo" data-izmeni="gume:${g.id}">Izmeni</button>
          <button class="dugme dugme-okvir dugme-malo" data-obrisi="gume:${g.id}">Obriši</button></td>
    </tr>`).join("");
  el("sadrzaj").innerHTML = `
    <div class="alati"><button class="dugme dugme-zuto" data-dodaj="gume">Dodaj gumu</button></div>
    <p class="rezultati-info">Cenu i količinu menjate direktno u tabeli, čuva se čim izađete iz polja. Količina 0 znači da guma nije na stanju.</p>
    <div class="tabela-omotac"><table>
      <thead><tr><th>Dimenzija</th><th>Guma</th><th>Sezona</th><th>Cena (din)</th><th>Na stanju</th><th>Na sajtu</th><th></th></tr></thead>
      <tbody>${redovi || `<tr><td colspan="7">Nema guma. Dodajte prvu.</td></tr>`}</tbody>
    </table></div>`;
}

// ---------- Prodavnica ----------
function nacrtajProizvode() {
  const redovi = podaci.proizvodi.map((p) => `
    <tr class="${p.aktivan ? "" : "neaktivan"}">
      <td>${esc(p.kategorija)}</td>
      <td>${esc(p.naziv)}</td>
      <td><input class="mali" type="number" min="0" value="${p.cena ?? ""}" placeholder="na upit" data-brzo="proizvodi:${p.id}:cena" aria-label="Cena"></td>
      <td><input type="checkbox" ${p.na_stanju ? "checked" : ""} data-brzo="proizvodi:${p.id}:na_stanju" aria-label="Na stanju"></td>
      <td><input type="checkbox" ${p.aktivan ? "checked" : ""} data-brzo="proizvodi:${p.id}:aktivan" aria-label="Prikaži na sajtu"></td>
      <td><button class="dugme dugme-okvir dugme-malo" data-izmeni="proizvodi:${p.id}">Izmeni</button>
          <button class="dugme dugme-okvir dugme-malo" data-obrisi="proizvodi:${p.id}">Obriši</button></td>
    </tr>`).join("");
  el("sadrzaj").innerHTML = `
    <div class="alati"><button class="dugme dugme-zuto" data-dodaj="proizvodi">Dodaj artikal</button></div>
    <p class="rezultati-info">Prazna cena znači "cena na upit". Isključite "Na sajtu" da sakrijete artikal bez brisanja.</p>
    <div class="tabela-omotac"><table>
      <thead><tr><th>Kategorija</th><th>Naziv</th><th>Cena (din)</th><th>Na stanju</th><th>Na sajtu</th><th></th></tr></thead>
      <tbody>${redovi || `<tr><td colspan="6">Nema artikala. Dodajte prvi.</td></tr>`}</tbody>
    </table></div>`;
}

// ---------- Dodavanje, izmena, brisanje ----------
const prozor = el("izmena");
let uIzmeni = null;

function otvoriIzmenu(tabela, red) {
  uIzmeni = { tabela, id: red ? red.id : null };
  el("izmena-naslov").textContent = red ? "Izmena" : (tabela === "gume" ? "Nova guma" : "Nov artikal");
  el("forma-izmene").innerHTML = POLJA[tabela].map(([ime, natpis, tip, o]) => {
    const v = red ? (red[ime] ?? "") : "";
    const req = o.required ? " required" : "";
    let kontrola;
    if (tip === "select") kontrola = `<select id="i-${ime}" name="${ime}">${o.opcije.map(([val, txt]) => `<option value="${val}"${val === v ? " selected" : ""}>${txt}</option>`).join("")}</select>`;
    else if (tip === "textarea") kontrola = `<textarea id="i-${ime}" name="${ime}" maxlength="2000">${esc(v)}</textarea>`;
    else kontrola = `<input id="i-${ime}" name="${ime}" type="${tip}" value="${esc(v)}"${req}${o.min !== undefined ? ` min="${o.min}"` : ""}${o.max !== undefined ? ` max="${o.max}"` : ""}${o.step ? ` step="${o.step}"` : ""}>`;
    return `<div class="polje"><label for="i-${ime}">${natpis}</label>${kontrola}</div>`;
  }).join("") + `<div id="i-status" aria-live="polite"></div><button class="dugme dugme-zuto" type="submit">Sačuvaj</button>`;
  prozor.showModal();
}

el("sadrzaj").addEventListener("click", async (e) => {
  const d = e.target.closest("[data-dodaj]");
  const iz = e.target.closest("[data-izmeni]");
  const ob = e.target.closest("[data-obrisi]");
  if (d) otvoriIzmenu(d.dataset.dodaj, null);
  if (iz) {
    const [t, id] = iz.dataset.izmeni.split(":");
    otvoriIzmenu(t, podaci[t].find((x) => x.id == id));
  }
  if (ob) {
    const [t, id] = ob.dataset.obrisi.split(":");
    const savet = t === "upiti" ? "" : " Ako samo hoćete da sakrijete, isključite \"Na sajtu\".";
    if (!confirm("Da li sigurno brišete? Ovo ne može da se vrati." + savet)) return;
    const { error } = await baza.from(t).delete().eq("id", id);
    if (error) alert("Brisanje nije uspelo.");
    ucitajSve();
  }
});

el("forma-izmene").addEventListener("submit", async (e) => {
  e.preventDefault();
  const { tabela, id } = uIzmeni;
  const zapis = {};
  POLJA[tabela].forEach(([ime, , tip]) => {
    const v = el("i-" + ime).value.trim();
    if (tip === "number") zapis[ime] = v === "" ? null : Number(v);
    else zapis[ime] = v === "" ? null : v;
  });
  const upit = id ? baza.from(tabela).update(zapis).eq("id", id) : baza.from(tabela).insert(zapis);
  const { error } = await upit;
  if (error) {
    el("i-status").innerHTML = `<div class="poruka-greska">Nije sačuvano: proverite polja. (${esc(error.message)})</div>`;
    return;
  }
  prozor.close();
  ucitajSve();
});

prozor.querySelector("[data-zatvori]").addEventListener("click", () => prozor.close());

// Novi upiti se proveravaju svakog minuta
// (samo na tabu Upiti, da ne prekida kucanje cena u tabelama)
setInterval(() => { if (!el("radno").hidden && !prozor.open && aktivniTab === "upiti") ucitajSve(); }, 60000);

proveriPrijavu();
