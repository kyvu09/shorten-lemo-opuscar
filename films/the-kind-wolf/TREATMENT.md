# TREATMENT — The Kind Wolf (Bác Sói Tốt Bụng)

- **Slug**: `films/the-kind-wolf/`
- **Format**: `1920×1080` (16:9), `24 fps` (12 fps drawn boil + substitution acting; 24 fps camera & watercolour wash)
- **Language**: Bilingual **EN → VI** narration (every sentence spoken in English first with 4 role-played Kokoro offline voices, followed after a 0.28s breath by Vietnamese via Edge-TTS male/female role-played voices) + bilingual EN/VI printed subtitles on paper knock-out
- **Audience**: Young English learners (ages 4–8) & beginners learning conversational dialogue and kindness vocabulary through storytelling
- **Core Message**: *Friends help each other!* (*Bạn bè luôn giúp đỡ lẫn nhau!*)
- **Vocabulary Tags (6)**: `FOREST` (khu rừng), `RIVER` (dòng sông), `WOLF` (bác sói), `HUNGRY` (đói bụng), `APPLE` (quả táo), `FRIENDS` (bạn bè)

---

## 1. Three Candidate Structures & Choice

1. **Candidate A — Continuous Left-to-Right Forest Panorama (CHOSEN)**:
   One wide `3200×1800` storybook spread moving naturally from left to right:
   - *Left (`x ≈ 300–1150`)*: Sunlit morning forest path where Little Dog meets Tabby Cat and invites her to walk to the river.
   - *Center (`x ≈ 1150–1950`)*: Big rustling oak tree where a loud rustle freezes both friends, and tall Gray Wolf steps out from behind the trunk — initially intimidating, then melting into a warm laugh and a sad hungry sigh.
   - *Right (`x ≈ 1950–2950`)*: Shady picnic apple tree beside a sparkling blue river where Dog & Cat share red apples with Gray Wolf, and a **warm rose friendship watercolour wash** sweeps across the page revealing hidden **white-wax hearts ❤️ & woodland sparkles**.
   - *Ending*: Pull-out revealing the finished crayon drawing taped onto a mint refrigerator door.
   - *Why chosen*: Natural picture-book reading flow (left→right), clear spatial geography for children, and 100% compatible with direct visual editing in Crayon Book Web Studio GUI.
2. **Candidate B — 3-Page Flip**: Separate pages with page-turn transitions between Walk / Wolf / Picnic. Breaks the single-page reveal of the whole woodland friendship panorama and complicates interactive editing in Web Studio.
3. **Candidate C — Colouring-Book Outline**: All outlines pre-drawn from frame 1; loses the surprise tension when Gray Wolf steps out from behind the tree.

---

## 2. Crayon Box & Single Watercolour Wash (≤12 crayons, no black)

| Slot | Role | Hex | Usage |
|---|---|---|---|
| Paper | Ground | `#f4efe3` | Warm off-white anchored toothy paper |
| `ink` | Outline | `#472e1e` | Deep warm cocoa outlines & printed text (never black) |
| `ochre` | Warm tan/wood | `#c88a3b` | Little Dog fur, Tabby Cat stripes, tree trunks, apple basket |
| `yellow` | Sunny gold | `#f2be2c` | Tabby Cat fur, morning sun, dog collar bell, wildflowers |
| `red` | Accent | `#d94436` | Red apples, Little Dog collar, hearts accent |
| `pink` | Warm blush | `#e8877d` | Cheeks, inner ears, cat nose, blossoms |
| `green` | Woodland | `#5a9c46` | Forest meadow, tree canopies, leafy bushes |
| `sky` | Water & bow | `#5da7d6` | Winding river, Tabby Cat bow tie, singing bluebird |
| `rain` | Wolf coat | `#77859a` | Gray Wolf fluffy warm-slate fur |
| `peach` | Cream fur | `#f5cca7` | Dog muzzle/belly, Wolf fluffy chest ruff & snout underside |
| `white` | Wax resist | `#fbfaf4` | Eye catchlights + **hidden hearts ❤️, sparkles & sunbeams** |
| **Wash (1 only)** | Friendship glow | `#d6847c` | Warm sunset-rose watercolour sweeping across Act 3 picnic to reveal white-wax hearts |

---

## 3. Cast & Bilingual Role-Played Voices

| Character | Model ID | Proportions & Visual Hooks | EN Voice (Kokoro Offline) | VI Voice (Edge-TTS) |
|---|---|---|---|---|
| **Narrator** | — | Storyteller printed words | `af_heart` (speed `0.88`) | `vi-VN-HoaiMyNeural` (`-4%`) |
| **🐶 Little Dog** | `little_dog` | ~255px tall, golden-ochre puppy, floppy ears, cream muzzle, red collar + yellow bell, wagging tail | `af_sky` (speed `0.90`) | `vi-VN-HoaiMyNeural` (`+4%`, `+3Hz`) |
| **🐱 Tabby Cat** | `tabby_cat` | ~245px tall, butter-yellow tabby, pointy pink-lined ears, ochre forehead/cheek stripes, whiskers, sky-blue bow, striped S-tail | `bf_emma` (speed `0.90`) | `vi-VN-HoaiMyNeural` (`+2%`, `+6Hz`) |
| **🐺 Gray Wolf** | `gray_wolf` | ~360px tall (1.4× bigger!), fluffy slate-gray fur, cream chest ruff, pointed ears, expressive long snout, big bushy tail | `am_michael` (speed `0.84`) | `vi-VN-NamMinhNeural` (`-6%`, `-4Hz`) |

---

## 4. Beat Sheet, Shot List & Sound Cue Map

*(Exact line start/end timestamps will be locked automatically from measured EN+VI WAV durations in Step 5.)*

| Act | Lines | Visual Action & Camera Move | Vocabulary Tag | Foley & Music Cue |
|---|---|---|---|---|
| **Act 1: Sunny Morning** | `l01`–`l05` | Opening wide on sunny forest path + book title *"The Kind Wolf / Bác Sói Tốt Bụng"*. Little Dog walks right, waves to Tabby Cat; slow camera truck right revealing the sparkling blue river ahead. | `FOREST`, `RIVER` | Gentle ukulele + recorder morning lilt; distant bird chirp; soft footsteps & crayon swishes. |
| **Act 2A: The Loud Sound** | `l06`–`l08` | **Beat of silence (1.2s)** before *"Suddenly..."* — bushes shake, rustle puff lines pop behind the big central oak! Dog & Cat freeze in `scared` poses. Camera holds medium-tight on the shaking tree. | — | **Silence beat #1** → crisp woodblock + bush rustle foley; bassoon sneaks in low pizzicato. |
| **Act 2B: Gray Wolf Appears** | `l09`–`l13` | Big Gray Wolf steps out (`peek` → `wave` → `laugh`). Dog & Cat tremble (`scared`), then blink in surprise as Wolf holds his belly laughing warmly (*"Hahaha! Don't be afraid."*). | `WOLF` | Low bassoon chord on wolf reveal → warms into playful bassoon chuckle + marimba bounce. |
| **Act 2C: The Hungry Sigh** | `l14`–`l16` | **Beat of silence (1.1s)** as Wolf's ears droop (`sad_hungry`, tummy rumble curl). Camera pushes softly in on Wolf & Dog's empathetic reaction. | `HUNGRY` | **Silence beat #2** → gentle ocarina/clarinet tender solo; soft tummy rumble foley. |
| **Act 3A: Sharing Apples** | `l17`–`l20` | Tabby Cat & Little Dog brighten up (`offer_apple`) next to the woven apple basket; Wolf's eyes light up (`surprised` → `eat_apple`, crunchy bite *"Yummy!"*). | `APPLE` | Bright glockenspiel chimes; crisp apple crunch foley; ukulele returns warmly. |
| **Act 3B: Friendship Wash** | `l21`–`l24` | Camera widens to hold the whole woodland picnic under the big apple tree (`sit_eat` → `cheer`). **Warm rose watercolour wash** sweeps smoothly across the page, **revealing hidden white-wax hearts ❤️ & sparkles**! | `FRIENDS` | Wet brush sweep foley (panned L→R→L); glockenspiel sparkles on each uncovered heart; full joyful theme (ukulele + recorder + marimba + hand chimes). |
| **Ending** | Final 4s | **Fridge Pull-Out** showing the finished crayon drawing taped to a mint kitchen fridge with magnets & crayons below + *"THE END! ❤️"* | — | Final gentle chord + soft tape/magnet click + fade to warm room tone. |
