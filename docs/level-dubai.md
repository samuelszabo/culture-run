# Level: Dubaj — Burj Khalifa (beh v oblakoch)

Tretia krajina a tretí level. Najväčšia zmena oproti Číne a Slovenskému raju:
hráč **nebeží po rovine, ale skáče ponad medzery v oblakovej ceste**, vysoko nad
mestom. Z mora oblakov **trčia iba špičky mrakodrapov** (Burj Khalifa a ďalšie),
dookola sa klenú **dúhy**. Hrateľná odmena je **Unicorn (jednorožec)**, na ktorom
sa dá level prejsť znova.

Interné id levelu: `burj-khalifa`. Kľúč krajiny: `dubai`. Vlajka: 🇦🇪.

## Koncept mechaniky — prečo „skákanie medzi oblakmi"

Doteraz mal každý level vlastný „podpis" v rámci tej istej hernej slučky:

- **Čína** — uhýbanie do strán (statické + pohyblivé + vystreľujúce prekážky).
- **Slovenský raj** — rebríkové brány (climb mini-hra) + naháňajúci medveď.
- **Dubaj** — **časovanie skoku** ponad medzery v oblakoch.

Dôležité: **herná logika ostáva 2D v track-space** (ako káže `CLAUDE.md`). Nemeníme
kolízny model ani súradnicový kontrakt — len pridáme nový typ prekážky a nové
prostredie. Skok už v hre existuje (`JUMP_VELOCITY=540`, `JUMP_GRAVITY=1800`,
apex ~81 px, vo vzduchu ~0.6 s). V Dubaji sa z neho stáva **hlavná** mechanika.

### Medzera v oblakoch = „obrátená" prekážka

Bežná prekážka v hre škodí, **keď NIE si vo vzduchu** alebo keď do nej vbehneš.
Medzera v oblakoch je presný opak:

- Nový typ prekážky `cloud-gap` (plná šírka cesty alebo jej časť).
- **Smrteľná iba keď je hráč na zemi** (`jumpHeight <= JUMP_CLEAR_HEIGHT`).
- Keď je hráč vo vzduchu (preskočí ju), prejde bez ujmy.
- Pri zlyhaní hráč **padá pod oblaky** → fáza `dying` (znovupoužitá), strata života,
  návrat ako po inej smrti (3 životy, skórovanie ako Čína/Slovensko).

Skill je v tom, že skok treba **začať pred okrajom medzery** — vzdušná dráha pri
`BASE_SPEED 240` je ~144 px (na konci levelu pri +30 % rýchlosti viac), takže
medzery hĺbky ~80–120 px (v `trackY`) sú prejditeľné s rezervou. Hĺbka medzery a
okno „na zemi" sa vyladia simuláciou (parita s Čínou/Slovenskom — viď testy).

### Špičky mrakodrapov = uhýbanie do strán

Z oblakov trčia **iba vrchy** mrakodrapov. Funkčne sú to **statické prekážky na
uhýbanie** (typ `tower-top`, správanie ako `wall`/`stall` — zaberú časť šírky cesty,
obíď ich doľava/doprava). Tak dostaneme dve osi výzvy:

- úseky **čisto na časovanie skoku** (medzery cez celú šírku),
- úseky **na uhýbanie** (špičky mrakodrapov),
- a ku koncu levelu **kombinácia** oboch = rastúca náročnosť.

(Voliteľné, neskôr: jemný „double jump" / plachtenie pre Unicorna s krídlami —
ale do prvej verzie to nepatrí, držme sa jedného skoku kvôli balansu.)

### Vizuálny pocit oblakov

V `render3d/world.ts` pridáme `cloudHeight(trackY)` (analógia k `slovakPathHeight`)
— jemné vlnenie celej oblakovej cesty, aby pôsobila vzdušne. Čisto kozmetické,
kolízie ostávajú 2D.

## Prostredie

- **Miesto:** more bielych oblakov vysoko nad Dubajom, z ktorého trčia špičky
  mrakodrapov; po stranách a nad traťou sa klenú dúhy.
- **Paleta:** biela a perleťová (oblaky), sýta modrá obloha, zlatá/jantárová
  púštne slnko, dúhové akcenty.
- **Pozadie:** modré až zlatisté nebo, vrcholy mrakodrapov v opare, dúhové oblúky,
  prípadne diaľkový obrys Burj Khalifa nad horizontom.
- **Cesta:** súvislá oblaková „dlažba" (instanced biele chumáče) prerušená
  medzerami, cez ktoré presvitá modrá hĺbka.

## Parametre

| Parameter | Hodnota |
|---|---|
| Dĺžka behu | ~75 s (rovnaký `TRACK_LENGTH = 20000`) |
| Štartová rýchlosť | základná, na konci +30 % |
| Životy | 3 |
| Hlavná mechanika | časovaný skok ponad medzery v oblakoch |
| Odmena za 5★ | spoločník (sokolík) |
| Hrateľná odmena | Unicorn (jednorožec) |

## Prekážky

| Prekážka | Typ | Správanie |
|---|---|---|
| Medzera v oblakoch | `cloud-gap` | smrteľná **iba na zemi**; preskoč ju skokom |
| Špička mrakodrapu | `tower-top` (uhýbanie) | trčí z oblakov, zaberá časť šírky — obíď |
| (neskôr) pohyblivý chumáč/dron | pohyblivá | prechádza naprieč, na uhýbanie |

## Zbierateľné jedlá

Mirror Slovenska (3 hlavné druhy, plus nápady navyše). Album/fakty **musia byť
fakticky správne** (pravidlo z `CLAUDE.md`).

| Jedlo | Prečo sa hodí |
|---|---|
| **Dubajská čokoláda** | trendová pistáciovo-kunafa čokoláda, deti ju poznajú — hlavný zber |
| **Datle (datle)** | ikonické emirátske jedlo, symbol pohostinnosti |
| **Luqaimat** | tradičné sladké medové guľôčky (cesto vyprážané do zlata) |

Nápady navyše (zámena/rozšírenie): **karak chai** (korenený mliečny čaj, v UAE
mimoriadne populárny), **čokoláda z ťavieho mlieka**, **baklava**. Pre paritu
balansu odporúčam ostať pri 3 druhoch ako na Slovensku.

> Pozn.: **dúhy** držme ako **scénu** (oblúky nad traťou), nie ako zber — o dúhe sa
> ťažko robí pravdivý „album fakt". Ak by sme chceli dúhový bonus, nech je to čisto
> bodový pickup mimo albumu (rozhodnutie na neskôr).

## Pamiatky (landmarks)

Tri, ako v ostatných leveloch — výrazné siluety, ktoré **trčia z oblakov**:

| Pamiatka | Poznámka |
|---|---|
| **Burj Khalifa** | najvyššia budova sveta (828 m) — hrdina levelu |
| **Burj Al Arab** | hotel v tvare plachty |
| **Dubai Frame** | obrovský zlatý „rám" — nápadná silueta nad oblakmi |

(Alternatívy: Museum of the Future — prstenec, Palm Jumeirah.)

## Odmeny

Štruktúra ako Slovensko (spoločník za 5★, dve kozmetiky podľa skóre, hrateľná
postavička za najvyššie skóre). Všetky patria do šatníka krajiny `dubai`.

| Odmena | Id | Odomknutie | Typ |
|---|---|---|---|
| **Sokolík (spoločník)** | `falcon-pet` | 5★ na `burj-khalifa` | spoločník (sokol = národný vták UAE, edukačné) |
| **Dúhové krídla** | `rainbow-wings` | skóre ~750 | kozmetika (krídla pre ľubovoľnú postavičku) |
| **Dúhový chvost** | `rainbow-tail` | skóre ~950 | kozmetika (dúhová stopa, ako `dragon-tail`) |
| **Hrateľný Unicorn** | `playable-unicorn` | skóre ~1050 | odomkne postavičku `unicorn` (`equippable:false`) |

Prahy (750/950/1050) zladíme tak, aby `maxScore` levelu vyšlo ~1080 (ako Slovensko)
— počty/body zberu sa doladia a **assertne v testoch**.

### Unicorn ako hrateľná postavička

Vzor je `playable-bear` (Slovensko): odmena `playable-unicorn` odomkne v
`COUNTRY_CHARACTERS['dubai']` postavičku `unicorn`. Hráč prejde Dubaj najprv ako
chlapec/dievča/mačka a **Unicorna si odomkne ako vrcholovú odmenu**, potom môže
level hrať za neho.

> **Rozhodnutie na potvrdenie:** Unicorn ako **odmena na odomknutie** (vzor medveď,
> odporúčané — dáva cieľ, na ktorý sa hrá) **vs.** Unicorn dostupný od začiatku v
> Dubaji. Plán počíta s prvou možnosťou; ľahko sa zmení pridaním `unicorn` do
> `COUNTRY_CHARACTERS['dubai']` aj bez odmeny.

## Kvíz (4 otázky, 2 náhodné po leveli)

Fakty overiteľné a pravdivé:

1. Aká vysoká je Burj Khalifa? (**828 m**)
2. V ktorej krajine je Dubaj? (**Spojené arabské emiráty**)
3. Z čoho je slávna „dubajská čokoláda"? (**pistácie + kunafa**)
4. Ktorý vták je symbolom Emirátov? (**sokol**)

## Súbory na úpravu (implementačná mapa)

| Oblasť | Súbor | Zmena |
|---|---|---|
| Dáta levelu | `src/levels/burj-khalifa.ts` (nový) | `createBurjKhalifaLevel(): Level` — generátory medzier, špičiek, zberu |
| Registry | `src/levels/registry.ts` | zápis do `LEVELS`, `COUNTRY_LEVEL.dubai`, `COUNTRY_CHARACTERS.dubai`, landmarks |
| Typy | `src/game/types.ts` | `ObstacleKind += 'cloud-gap' | 'tower-top'`; `CollectibleKind += 'dubai-choc' | 'datle' | 'luqaimat'`; `Character += 'unicorn'`; `RewardId +=` 4 nové |
| Kolízie | `src/game/collision.ts` | `cloud-gap` škodí len keď `jumpHeight <= JUMP_CLEAR_HEIGHT`; `tower-top` ako wall |
| Odmeny | `src/game/rewards.ts` | 4 nové odmeny (country `dubai`) |
| Postavička | `src/render3d/player3d.ts` | geometria Unicorna (roh, dúhová hriva); kozmetiky krídla/chvost; sokolík spoločník |
| Prostredie | `src/render3d/environments/burj-khalifa.ts` (nový) | oblaková cesta s medzerami, špičky mrakodrapov, dúhy, slnko, hmla |
| Svet | `src/render3d/world.ts` | `OBSTACLE_WORLD_HEIGHTS` pre nové typy; `cloudHeight(trackY)`; výškové ponímanie medzier |
| Album | `src/game/album.ts` | 3 jedlá + 3 pamiatky Dubaja |
| Kvíz | `src/game/quiz.ts` | 4 otázky s `levelId: 'burj-khalifa'` |
| UI | `src/ui/screens.ts` | odomknúť 'dubai' v zozname krajín; šatník číta z registry |
| i18n | `src/i18n/sk.json` | všetky kľúče: jedlá, pamiatky, kvíz, kartičky, odmeny, názov oblasti |
| Testy | `tests/**` | parita prejditeľnosti (skok cez medzery), `maxScore` levelu |

## Riziká a otvorené otázky

- **Balans skoku cez medzery** — overiť simuláciou, že 5★ je dosiahnuteľné (0 smrtí
  + ~92 % zberu) ako pri ostatných leveloch; vyladiť hĺbku medzery vs. dĺžku skoku.
- **Vizuál medzery** — musí byť na prvý pohľad jasné, kde je diera (čitateľnosť pre
  deti 8–12), nie nečakané pády.
- **Mobilné ovládanie** — skok je `jumpQueued` (tap/klávesa); na dotyku treba jasné
  gesto (tap = skok) popri „finger-follow" uhýbaní — preveriť, či nekoliduje.
- **Unicorn quadruped vs. biped** — mačka je už quadruped; Unicorn môže vychádzať
  z nej (telo + roh + dúhová hriva), nech sa zmestí do existujúcich animácií.
