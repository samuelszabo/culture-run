# Culture Run 3D — redizajn

## Vízia

Hra prechádza z 2D pohľadu zhora na **skutočné 3D** (Three.js) s kamerou za chrbtom postavičky (štýl Subway Surfers). Cieľ: realistickejší zážitok a silnejšia edukácia — hráč spoznáva skutočné jedlá, pamiatky a atmosféru krajiny.

2D verzia je zachovaná v git tagu `v1-2d`.

## Čo zostáva (zmrazené počas prechodu)

Herná logika je nezávislá od vykresľovania a **nemení sa**:
`game/types.ts`, `game/obstacles.ts`, `game/collectibles.ts`, `game/movers.ts`, `game/collision.ts`, `game/scoring.ts`, `game/lives.ts`, `game/player.ts`, `game/loop.ts`, `game/rewards.ts`, `storage/save.ts`, `i18n/*`, `levels/*`, DOM obrazovky (`ui/screens.ts`, `ui/cards.ts`).

Simulácia (sim6) zostáva platným dôkazom hrateľnosti — kolízie sú 2D pôdorys (AABB), čo je pre behačku správne aj v 3D.

## Mapovanie súradníc (kontrakt v `render3d/world.ts`)

- Traťové súradnice (x ∈ 60..420, trackY ∈ 0..20000) sa premietajú do 3D: `worldX = (x − 240) / UNIT`, `worldZ = −trackY / UNIT`, `UNIT = 50`
- Objekty stoja na pevných pozíciách, **hráč a kamera sa hýbu dopredu** (−z)
- Kamera: za hráčom, mierne nad ním, pozerá dopredu na trať

## Nová štruktúra vykresľovania

```
src/render3d/
  world.ts       kontrakt: UNIT, toWorldX/toWorldZ, rozmery, kamera konšt.
  scene.ts       Three.js stage: renderer, kamera, svetlá, hmla + prostredie
                 (most, voda, hory, pagody, lampióny) — scene-dev
  entities.ts    meshe prekážok a jedál synchronizované z GameState — entities-dev
  player3d.ts    3D postavička, animácie, kozmetika (drak, labubu) — player3d-dev
```

HUD a výsledkovka prechádzajú z canvasu do **DOM overlay** (`ui/hud-dom.ts`, `ui/results-dom.ts`) — ui-dev.

## Edukačné systémy (zo zadania, fázy 6–7)

1. **Názvy pri zbere** — pri zbere jedla sa krátko zobrazí jeho skutočný názov („Baozi!")
2. **Album / zbierka** — pozbierané jedlá a videné pamiatky sa ukladajú do albumu s faktom (localStorage, nová obrazovka z menu)
3. **Kvíz po leveli** — 1–2 otázky o krajine za bonusové body
4. **Pamiatky popri trati** — skutočné pamiatky míňané počas behu s krátkym titulkom (pagoda, čínsky múr, lampiónový festival)

Obsah musí byť **fakticky správny** — žiadne vymyslené údaje; fakty držať všeobecné a overiteľné.

## Assety (CC0)

- Jedlá a pamiatky: free low-poly GLB modely (Kenney, Poly Pizza, Quaternius — licencia CC0)
- Pipeline overená spikom: GLTFLoader + Vite `public/models/` funguje
- `public/models/ATTRIBUTION.md` eviduje zdroj každého modelu
- Fallback: ak sa model nedá získať, low-poly z geometrie kódom

## Fázy

| Fáza | Obsah |
|---|---|
| 5 | 3D základ: scéna, prostredie mosta, 3D postavička, prekážky/jedlá ako jednoduché meshe, DOM HUD + výsledkovka, plne hrateľné |
| 6 | CC0 modely jedál a pamiatok, pamiatky popri trati s titulkami |
| 7 | Edukácia: názvy pri zbere, album, kvíz po leveli |
| 8 | Polish, výkon na mobile, nasadenie |
