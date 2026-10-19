// =============================================================
//  ZAJEDNIČKI KOD ZA SVE STRANE
//  Zaglavlje, podnožje, veza sa bazom i pomoćne funkcije.
//  Zaglavlje i podnožje su ovde na jednom mestu, pa su na svim
//  stranama isti.
// =============================================================

const K = window.KONFIG;

// Veza sa bazom
const baza = window.supabase.createClient(K.supabaseUrl, K.supabaseKljuc);

// Bezbedno ubacivanje teksta u HTML (da niko ne može da ubaci svoj kod)
function esc(tekst) {
  return String(tekst ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// 3469 -> "3.469 din"
function cena(iznos) {
  if (iznos === null || iznos === undefined) return null;
  // Tačka za hiljade ručno, jer neki pretraživači ne znaju srpski format i stave zarez
  return String(Math.round(Number(iznos))).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " din";
}

// Slika gume kad proizvod nema svoju fotografiju
const IKONA_GUME = `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
  <circle cx="50" cy="50" r="44" stroke="currentColor" stroke-width="12"/>
  <circle cx="50" cy="50" r="18" stroke="currentColor" stroke-width="6"/>
  <path d="M50 6v14M50 80v14M6 50h14M80 50h14" stroke="currentColor" stroke-width="5"/>
</svg>`;

function slikaIliIkona(url, alt) {
  if (url) return `<img src="${esc(url)}" alt="${esc(alt)}" loading="lazy">`;
  return IKONA_GUME;
}

// Zaglavlje: meni sa označenom trenutnom stranom
function nacrtajZaglavlje(trenutna) {
  const stavke = [
    ["index.html", "Početna"],
    ["gume.html", "Gume"],
    ["prodavnica.html", "Prodavnica"],
    ["index.html#usluge", "Usluge"],
    ["index.html#kontakt", "Kontakt"],
  ];
  const meni = stavke
    .map(([href, ime]) =>
      `<a href="${href}"${ime === trenutna ? ' aria-current="page"' : ""}>${ime}</a>`)
    .join("");
  const tel = K.lokacije[0].telefoni[0];

  document.getElementById("zaglavlje").innerHTML = `
    <div class="omotac">
      <a class="logo" href="index.html"><img src="slike/logo-planeta-guma.png" alt="${esc(K.firma.ime)}" width="188" height="43"></a>
      <button class="dugme-meni" aria-expanded="false" aria-controls="glavni-meni">Meni</button>
      <nav class="meni" id="glavni-meni" aria-label="Glavni meni">${meni}</nav>
      <a class="zaglavlje-tel" href="tel:${tel.replaceAll(" ", "")}">${esc(tel)}</a>
    </div>`;

  nacrtajObavestenje();

  const dugme = document.querySelector(".dugme-meni");
  const nav = document.getElementById("glavni-meni");
  dugme.addEventListener("click", () => {
    const otvoren = nav.classList.toggle("otvoren");
    dugme.setAttribute("aria-expanded", otvoren);
  });
}

// Traka sa obaveštenjem iznad zaglavlja (tekst se menja u config.js)
function nacrtajObavestenje() {
  const o = K.obavestenje;
  if (!o || !o.tekst) return;
  try { if (sessionStorage.getItem("pg-obavestenje-zatvoreno") === o.tekst) return; } catch { /* nema pamćenja, traka se prikazuje */ }

  const traka = document.createElement("div");
  traka.className = "obavestenje";
  traka.innerHTML = `
    <div class="omotac">
      <div class="obavestenje-tekst">
        <span class="obavestenje-oznaka">${esc(o.oznaka || "Novo")}</span>
        <span class="obavestenje-poruka">${esc(o.tekst)}</span>
        ${o.link ? `<a class="obavestenje-link" href="${esc(o.link)}">${esc(o.linkTekst || "Pogledaj")}
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>` : ""}
      </div>
      <button class="obavestenje-zatvori" type="button" aria-label="Zatvori obaveštenje">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>`;
  document.getElementById("zaglavlje").before(traka);
  traka.querySelector(".obavestenje-zatvori").addEventListener("click", () => {
    traka.remove();
    try { sessionStorage.setItem("pg-obavestenje-zatvoreno", o.tekst); } catch { /* ništa */ }
  });
}

// Podnožje: lokacije i podaci firme
function nacrtajPodnozje() {
  const lok = K.lokacije
    .map((l) => `
      <div>
        <h3>${esc(l.ime)}</h3>
        <p>${esc(l.adresa)}</p>
        <p>${l.telefoni.map((t) => `<a href="tel:${t.replaceAll(" ", "")}">${esc(t)}</a>`).join(", ")}</p>
        <p>${l.radnoVreme.map(esc).join("<br>")}</p>
      </div>`)
    .join("");

  document.getElementById("podnozje").innerHTML = `
    <div class="omotac">
      <div>
        <h3>${esc(K.firma.ime)}</h3>
        <p>Gume, felne, akumulatori, ulja i servis na dve lokacije u Beogradu, od ${K.firma.osnovana}. godine.</p>
        <p><a href="mailto:${esc(K.firma.email)}">${esc(K.firma.email)}</a></p>
        <p><a href="${esc(K.firma.facebook)}" target="_blank" rel="noopener">Facebook</a> &nbsp; <a href="${esc(K.firma.instagram)}" target="_blank" rel="noopener">Instagram</a></p>
      </div>
      ${lok}
      <div class="podnozje-dno">
        © ${new Date().getFullYear()} ${esc(K.firma.pravnoIme)}, matični broj ${esc(K.firma.maticniBroj)}, PIB ${esc(K.firma.pib)}
        <p class="podnozje-zasluge">Fotografije: Frankieleon (CC BY 2.0, Flickr); David Osipov (CC BY 4.0, Wikimedia Commons).</p>
      </div>
    </div>`;
}

// Slanje upita firmi: čuva se u bazi, a po želji stiže i na email
async function posaljiUpit(upit) {
  const { error } = await baza.from("upiti").insert(upit);
  if (error) throw error;

  if (K.emailZaObavestenja) {
    const stavke = (upit.stavke || []).map((s) => `${s.kolicina} x ${s.naziv}`).join("\n");
    try {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(K.emailZaObavestenja)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `Nov upit sa sajta: ${upit.tip}`,
          Tip: upit.tip,
          Ime: upit.ime,
          Telefon: upit.telefon,
          Email: upit.email || "",
          Lokacija: upit.lokacija || "",
          Stavke: stavke,
          Poruka: upit.poruka || "",
        }),
      });
    } catch (e) {
      // Upit je već sačuvan u bazi, email je samo dodatak
      console.warn("Email obaveštenje nije poslato", e);
    }
  }
}

// Animacije pri skrolovanju: delovi označeni sa "otkrij" lagano uđu kad se
// pojave na ekranu, a brojke sa data-odbroj odbrojavaju do svoje vrednosti.
// Bez skripte ili uz "smanji pokrete" u podešavanjima sve je odmah vidljivo.
function pokreniAnimacije() {
  const bezPokreta = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (bezPokreta || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("animacije");

  const odbroj = (el) => {
    const cilj = Number(el.dataset.odbroj);
    const bezTacke = el.hasAttribute("data-bez-tacke");
    const od = bezTacke ? cilj - 60 : 0;
    const pocetak = performance.now();
    const traje = 1400;
    const korak = (sada) => {
      const t = Math.min(1, (sada - pocetak) / traje);
      const v = Math.round(od + (cilj - od) * (1 - Math.pow(1 - t, 3)));
      el.textContent = bezTacke ? String(v) : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      if (t < 1) requestAnimationFrame(korak);
    };
    requestAnimationFrame(korak);
  };

  const posmatrac = new IntersectionObserver((unosi) => {
    unosi.forEach((u) => {
      if (!u.isIntersecting) return;
      u.target.classList.add("vidljivo");
      u.target.querySelectorAll("[data-odbroj]").forEach(odbroj);
      posmatrac.unobserve(u.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  // Susedni elementi ulaze jedan za drugim, ne svi odjednom
  document.querySelectorAll(".otkrij").forEach((el) => {
    const braca = [...el.parentElement.children].filter((x) => x.classList.contains("otkrij"));
    el.style.setProperty("--kasnjenje", `${Math.min(braca.indexOf(el), 6) * 80}ms`);
    posmatrac.observe(el);
  });
}

// Lista lokacija za padajući meni u formama
function opcijeLokacija() {
  return K.lokacije.map((l) => `<option value="${esc(l.ime)}">${esc(l.ime)}, ${esc(l.adresa)}</option>`).join("");
}
