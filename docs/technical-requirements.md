# Culture Run — technické požiadavky

## Technologický stack

| Vrstva | Voľba | Zdôvodnenie |
|---|---|---|
| Jazyk | TypeScript | typová bezpečnosť pri hernej logike, žiadna runtime závislosť |
| Rendering | HTML5 Canvas 2D | hranatá 2D grafika nepotrebuje WebGL ani engine |
| Build | Vite | jediný dev nástroj — dev server, bundling, statický výstup |
| Runtime závislosti | **žiadne** | vlastný game loop, kolízie a sprite-y sú pre runner jednoduché |
| Úložisko | localStorage | bez backendu; progres je per-zariadenie |

Zvažovaný bol Phaser (osvedčený herný engine), ale pre jeden level s hranatou grafikou je vlastný Canvas kód menší, plne pod kontrolou a bez závislostí. Ak by hra narástla (fyzika, veľa levelov, komplexné animácie), prechod na Phaser sa prehodnotí.

## Architektúra

```
src/
  main.ts              vstupný bod, inicializácia
  game/
    loop.ts            requestAnimationFrame loop, fixed timestep update
    state.ts           stavový automat obrazoviek (menu, výber, hra, vyhodnotenie)
    player.ts          postavička: pohyb, kolízna obálka, vrstvy kozmetiky
    obstacles.ts       prekážky: statické, pohyblivé, vystreľujúce
    collectibles.ts    jedlo a voda, body
    collision.ts       AABB kolízie
    scoring.ts         skóre, penalizácie, výpočet hviezdičiek
  levels/
    china-bridge.ts    definícia levelu: trať, rozmiestnenie prekážok a predmetov, M
  render/
    renderer.ts        vykresľovanie sveta, parallax pozadie
    sprites.ts         hranaté sprite-y kreslené kódom (rect-based), bez obrázkov v v1
    particles.ts       častice (zber, chvost, konfety)
  ui/
    screens.ts         úvod, výber krajiny/oblasti, šatník, vyhodnotenie (HTML/CSS overlay)
    hud.ts             skóre, srdiečka, progress bar (Canvas alebo DOM overlay)
  input/
    keyboard.ts        šípky + AWSD
    touch.ts           dotykové ovládanie
  i18n/
    strings.ts         načítanie lokalizácie
    sk.json            slovenské texty
  storage/
    save.ts            localStorage: progres, odmeny, nastavenia
```

Princípy: žiadne zbytočné abstrakcie, level je dáta (zoznam entít s pozíciami), herná logika oddelená od vykresľovania, UI obrazovky sú obyčajné HTML/CSS overlay nad canvasom (jednoduchšia lokalizácia a responzivita než kresliť UI do canvasu).

## Ovládanie

### Klávesnica (počítač)
- **← / A** — pohyb doľava
- **→ / D** — pohyb doprava
- **↑↓ / W / S** — rezerva (v1 bez funkcie; prípadné zrýchlenie/spomalenie v budúcnosti)
- **Esc / P** — pauza

### Dotyk (mobil)
- **Ťahanie prstom (drag)** — postavička plynulo nasleduje horizontálnu pozíciu prsta (s vyhladením); prst môže byť kdekoľvek na obrazovke, postavička kopíruje jeho pohyb do strán
- Funguje aj krátke podržanie pri okraji — postavička sa hýbe smerom k prstu
- **Tlačidlo pauzy** v rohu obrazovky

Toto je kľúčové rozhodnutie pre voľný pohyb na mobile — drag-to-move je presný a intuitívny, netreba virtuálny joystick.

## Responzivita a zobrazenie

- Hracia plocha: **portrait orientácia**, logické rozlíšenie napr. 480×800, škálované na veľkosť okna so zachovaním pomeru strán (letterbox)
- Na desktope v landscape okne sa hracia plocha vycentruje, po stranách dekoratívne pozadie
- `devicePixelRatio` zohľadnený pre ostré vykresľovanie na retina/mobilných displejoch
- Minimálna podpora: posledné 2 verzie Chrome, Safari, Firefox, Edge; iOS Safari a Android Chrome

## Výkon

- Cieľ: **60 fps** na bežnom mobile (3 roky starý stredný rad)
- Fixed timestep update (napr. 60 Hz) oddelený od renderovania — konzistentná fyzika nezávislá od fps
- Žiadne alokácie v hernej slučke (object pooling pre častice a prekážky)
- Celková veľkosť buildu < 500 kB (bez obrázkových assetov to je ľahko splniteľné)

## Lokalizácia (i18n)

- **Žiadne texty natvrdo v kóde** — všetky reťazce v `i18n/sk.json`, prístup cez `t('kluc')`
- v1 obsahuje iba `sk.json`, štruktúra pripravená na `en.json` (pridanie = nový súbor + prepínač)
- Texty v UI počítajú s rôznou dĺžkou prekladov (flexibilné layouty)

## Ukladanie (localStorage)

```
cultureRun.save = {
  version: 1,
  character: "boy" | "girl",
  unlockedRewards: ["sparkly-tail", ...],
  equippedRewards: ["sparkly-tail", ...],
  bestScores: { "china-bridge": { score, stars } },
  settings: { sound: true, language: "sk" }
}
```

- Jeden kľúč, JSON, s `version` pre budúce migrácie
- **Progres je per-zariadenie** — bez backendu sa nesynchronizuje medzi zariadeniami (treba povedať hráčovi? v1 nie, je to bežné očakávanie pri webovkách pre deti)

## Nasadenie

- Statický web — výstup `vite build` sa dá hostovať kdekoľvek (GitHub Pages, Netlify, Cloudflare Pages)
- Žiadne API kľúče, žiadne externé služby, žiadna analytika v v1
- Funguje offline po prvom načítaní (v2: PWA manifest + service worker pre inštaláciu na plochu)

## Testovanie

- Herná logika (skóre, hviezdičky, kolízie) — jednotkové testy cez Vitest (jediná dev závislosť navyše)
- Hrateľnosť a ovládanie — manuálne na desktope (klávesnica) a reálnom mobile (dotyk)
- Test happy path: dohranie levelu bez smrti → 5★ pri pozbieraní ≥ 90 % predmetov
