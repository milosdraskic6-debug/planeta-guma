// =============================================================
//  TOČAK NA POČETNOJ STRANI
//  Crta točak po izabranoj dimenziji (npr. 205/55 R16): felna je
//  veća ili manja po prečniku, guma deblja ili tanja po visini boka.
//  Točak se dokotrlja kad se strana otvori, stalno se lagano okreće
//  i zavrti se brže kad kupac promeni dimenziju.
// =============================================================

function pokreniTocak(idPolja) {
  const svg = document.querySelector(".tocak");
  if (!svg) return;

  const polja = idPolja.map((id) => document.getElementById(id));
  const okret = document.getElementById("tocak-okret");
  const guma = document.getElementById("t-guma");
  const sare = document.getElementById("t-sare");
  const felna = document.getElementById("t-felna");
  const krugTeksta = document.getElementById("t-krug-teksta");
  const natpis = document.getElementById("t-natpis");
  const mere = document.getElementById("tocak-mere");

  const bezPokreta = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NAJVECI = 205;            // najveći poluprečnik u crtežu
  const MM_U_CRTEZ = 205 / 410;   // poluprečnik od 410 mm (guma od 820 mm) popuni ceo crtež
  const TLO = 200;                // točak stoji na tlu, pa se vidi kako raste i smanjuje se

  // Trenutne i ciljne veličine (poluprečnici u crtežu)
  let spolja = 150, felnaR = 95;
  let ciljSpolja = spolja, ciljFelna = felnaR;
  let ugao = 0;
  let brzina = bezPokreta ? 0 : 900;   // stepeni u sekundi; brzo na početku, dok se dokotrlja
  const MIRNA_BRZINA = 24;

  function izracunaj() {
    const [sirina, visina, precnik] = polja.map((p) => Number(p.value));
    const felnaMm = precnik * 25.4;
    const bokMm = (sirina * visina) / 100;
    const spoljaMm = felnaMm + 2 * bokMm;

    ciljSpolja = Math.min(NAJVECI, (spoljaMm / 2) * MM_U_CRTEZ);
    ciljFelna = Math.max(30, ciljSpolja * (felnaMm / spoljaMm));

    natpis.textContent = `PLANETA GUMA  •  ${sirina}/${visina} R${precnik}  •  `.repeat(3);
    mere.innerHTML = `<strong>${sirina}/${visina} R${precnik}</strong> · spoljni prečnik ${Math.round(spoljaMm)} mm · bok ${Math.round(bokMm)} mm`;
  }

  function nacrtaj() {
    guma.setAttribute("r", spolja.toFixed(1));
    felna.setAttribute("transform", `scale(${(felnaR / 100).toFixed(3)})`);

    // Šara gazećeg sloja: kratke pločice uz spoljnu ivicu
    const broj = 40;
    const dubina = Math.max(8, (spolja - felnaR) * 0.22);
    let d = "";
    for (let i = 0; i < broj; i++) {
      const a = (i / broj) * Math.PI * 2;
      const a2 = a + (Math.PI * 2) / broj * 0.55;
      const r1 = spolja - dubina, r2 = spolja + 0.5;
      d += `M${(Math.cos(a) * r1).toFixed(1)} ${(Math.sin(a) * r1).toFixed(1)}`
        + `L${(Math.cos(a) * r2).toFixed(1)} ${(Math.sin(a) * r2).toFixed(1)}`
        + `L${(Math.cos(a2) * r2).toFixed(1)} ${(Math.sin(a2) * r2).toFixed(1)}`
        + `L${(Math.cos(a2) * r1).toFixed(1)} ${(Math.sin(a2) * r1).toFixed(1)}Z`;
    }
    sare.innerHTML = `<path d="${d}"/>`;

    // Natpis na boku gume, na sredini između felne i gazećeg sloja
    const rt = (felnaR + spolja - dubina) / 2;
    krugTeksta.setAttribute("d", `M0 ${rt}A${rt} ${rt} 0 1 1 0 ${-rt}A${rt} ${rt} 0 1 1 0 ${rt}`);
    const velicina = Math.max(7, Math.min(15, (spolja - dubina - felnaR) * 0.42));
    natpis.parentNode.setAttribute("font-size", velicina.toFixed(1));
    natpis.parentNode.setAttribute("dy", (velicina * 0.35).toFixed(1));
  }

  let prosli = performance.now();
  function korak(sada) {
    const dt = Math.min(0.05, (sada - prosli) / 1000);
    prosli = sada;

    // Mekan prelaz ka novoj veličini
    spolja += (ciljSpolja - spolja) * Math.min(1, dt * 7);
    felnaR += (ciljFelna - felnaR) * Math.min(1, dt * 7);

    // Brzina se polako vraća na mirno okretanje
    brzina += (MIRNA_BRZINA - brzina) * Math.min(1, dt * 1.6);
    ugao = (ugao - brzina * dt) % 360;   // kotrlja se ulevo, pa se okreće suprotno od kazaljke
    okret.setAttribute("transform", `translate(0 ${(TLO - spolja).toFixed(1)}) rotate(${ugao.toFixed(2)})`);

    nacrtaj();
    requestAnimationFrame(korak);
  }

  polja.forEach((p) => p.addEventListener("change", () => {
    izracunaj();
    if (!bezPokreta) brzina = 520;
    if (bezPokreta) { spolja = ciljSpolja; felnaR = ciljFelna; nacrtaj(); postaviMirno(); }
  }));

  function postaviMirno() {
    okret.setAttribute("transform", `translate(0 ${(TLO - spolja).toFixed(1)})`);
  }

  izracunaj();
  if (bezPokreta) {
    spolja = ciljSpolja; felnaR = ciljFelna;
    nacrtaj();
    postaviMirno();
  } else {
    spolja = ciljSpolja; felnaR = ciljFelna;
    svg.classList.add("dokotrljaj");
    requestAnimationFrame(korak);
  }
}
