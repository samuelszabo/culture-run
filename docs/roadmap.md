# Culture Run — plán vývoja

## Verzia 1 (MVP) — Čína, jeden level

Cieľ: hrateľná, pekná, kompletná slučka s jedným levelom. Všetko ostatné počká.

### Fáza 1 — základ hry ✅
- [x] Projekt: Vite + TypeScript, štruktúra priečinkov, i18n so `sk.json`
- [x] Game loop (fixed timestep), škálovanie canvasu, portrait layout
- [x] Postavička: pohyb do strán, klávesnica (šípky + AWSD)
- [x] Dotykové ovládanie (drag-to-move)
- [x] Posúvajúca sa trať so statickými prekážkami, AABB kolízie
- [x] Smrť, 3 životy, nesmrteľnosť po smrti, koniec po 3 smrtiach

### Fáza 2 — herný obsah ✅
- [x] Zbierateľné predmety + skóre
- [x] Pohyblivé a vystreľujúce prekážky
- [x] Level Čína — most: dáta trate, stúpajúca náročnosť, cieľová čiara
- [x] Hviezdičky (prahy z M), penalizácia za smrť
- [x] HUD: skóre, srdiečka, progress bar

### Fáza 3 — obrazovky a progres ✅
- [x] Úvodná obrazovka, výber postavičky (chlapec/dievča)
- [x] Výber krajiny (vlajky — Čína odomknutá, ostatné „čoskoro") a oblasti
- [x] Vyhodnotenie: animované hviezdičky, odmena za 5★
- [x] Šatník: čínsky drak (odomykateľný), labubu vzhľad ako zamknutá ukážka, zapínanie/vypínanie
- [x] localStorage: ukladanie progresu, odmien a nastavení

### Fáza 4 — vizuál a vyladenie ✅
- [x] Parallax pozadie Číny, farebná paleta, lampióny, pagody (les pod múrom, cimburie, lampióny)
- [x] Animácie postavičky (beh, smrť, oslava), častice (zber, chvost, konfety)
- [x] Vzdelávacie kartičky (pred levelom, po leveli)
- [x] Balansovanie: simuláciou overené — 5★ dosiahnuteľné (0 smrtí + 92 % zberu), 1 smrť → max 4★
- [x] Nasadenie: hra je živá na https://culture-run.pages.dev/ (Cloudflare Pages)

## Verzia 2 — 3D redizajn (docs/redesign-3d.md)

### Fáza 5 — 3D základ (Three.js) ✅
- [x] Scéna: kamera za postavičkou, svetlá, hmla, prostredie Veľkého čínskeho múru (les, kopce, cimburie, strážne veže, lampióny)
- [x] 3D postavička (chlapec/dievča), animácie behu/smrti/oslavy, kozmetika (drak, labubu)
- [x] Prekážky a jedlá ako 3D meshe synchronizované z hernej logiky
- [x] HUD a výsledkovka v DOM overlay
- [x] Plne hrateľné v 3D, logika nezmenená (sim stále platí: 0 smrtí + 92 % = 5★)

### Fáza 6 — skutočné assety a pamiatky ✅
- [x] CC0 modely jedál (miska polievky, šálka čaju, bambusový parník — Kenney Food Kit) + ATTRIBUTION.md; pagoda a lev z geometrie (CC0 GLB neexistuje)
- [x] Pamiatky popri trati s titulkami a faktami (strážna veža, pagoda, kamenné levy)

### Fáza 7 — edukácia ✅
- [x] Názvy jedál pri zbere (toast pod HUD, jeden znovupoužívaný DOM element)
- [x] Album / zbierka s faktami (localStorage v2 s migráciou, obrazovka z menu, zamknuté položky „?")
- [x] Kvíz po leveli za bonusové body (2 náhodné otázky zo 4, bonus sa NEpočíta do hviezdičiek — balans 0 smrtí + 92 % = 5★ zostáva platný; bonus sa ráta do najlepšieho skóre a bodových odmien)

### Fáza 8 — polish a vydanie
- [x] Výkon na mobile: kvalita podľa zariadenia (render3d/quality.ts — low/high tier: pixelRatio 1.5/2, antialias, hmla 50/70, polovičná hustota stromov), animácie len po hmlu, blik petárd raz za snímok
- [ ] Nasadenie novej verzie (push → Cloudflare Pages; hra je živá na https://culture-run.pages.dev/) a overenie 60 fps na reálnom mobile

## Verzia 2.5 — Slovensko (Slovenský raj) ✅

- [x] Druhá krajina + level: **Slovensko — Slovenský raj** (level registry, prepínateľné 3D prostredia)
- [x] Soutiesky s rebríkmi: gorge-wall brány s rebríkovými lávkami (overené simuláciou — prejditeľné, parita s Čínou)
- [x] Naháňajúci medveď: beží za hráčom, pri každej smrti sa priblíži a v cieli/koncom hry ho chytí (3 životy, skórovanie ako Čína)
- [x] Odmeny: medvedík-spoločník (5★), veverička (750 b), slovenský kroj (950 b), hrateľná postavička medveď (1050 b)
- [x] Slovenské jedlá (halušky, pstruh, čučoriedky), pamiatky (roklina, vodopád, Tomášovský výhľad), kvíz a album
- [ ] Overenie vizuálu a 60 fps v prehliadači / na mobile

## Verzia 3 — rozšírenie

- Druhý level Číny (napr. Veľký čínsky múr) alebo ďalšia krajina (hlasovanie v rodine 🙂) — odomkne labubu vzhľad
- Angličtina (`en.json` + prepínač jazyka)
- Zvuky a hudba
- PWA: inštalácia na plochu mobilu, offline hranie
- Ďalšie odmeny (každý level jedna unikátna)

## Neskôr (nápady, nezáväzné)

- Viac krajín: Japonsko, Egypt, Taliansko, Slovensko...
- Viac oblastí na krajinu (3 levely = krajina „dokončená")
- Denná výzva, rebríček najlepších skóre na zariadení
- Kvízová otázka o krajine po leveli za bonusové body

## Zámerne mimo rozsahu

- Backend, účty, synchronizácia medzi zariadeniami
- Multiplayer
- Nákupy / monetizácia
