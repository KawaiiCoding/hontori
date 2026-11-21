# Hontori preview v2 — shared contract (READ FULLY)

Goal: a top-down 3/4-view 2D tile RPG preview with handheld-era quality pixel art (think the polish of late-generation
2D handheld monster RPGs: rich 3-4 tone shading, dithering, dark outlines on objects, highlights, soft cast shadows),
but 100% ORIGINAL art — do not copy any existing game's sprites, characters or look. Two scenes: inside the kid's home
(night intro, Hontori comes out of the fireplace/chimney) and the village outside.

## Rules
- Plain classic scripts (NO ES modules, NO imports, NO external assets/images). Everything drawn with Canvas 2D in code.
- Each file starts with `window.H = window.H || {};` and only adds its own namespace.
- Art is pre-rendered once into offscreen canvases (cache), then blitted with drawImage. Animated things: cache N frames.
- Pixel-art: integer coordinates, `fillRect` pixels, no anti-aliased arcs for sprites (draw pixels / use helper that
  plots circles pixel-by-pixel). Gradients only allowed in FX lighting.
- Tile size T = 16. Internal canvas 384x216, scaled up with nearest-neighbour.
- Coordinates: world pixels. Dir: 0=down 1=up 2=left 3=right.
- `t` = seconds elapsed (float). `env` = { t, time (0..24 hour), weather ('clear'|'rain'|'wind'|'snow'|'fog'), wind (0..1), indoor (bool) }.
- Verify with `node --check yourfile.js`. Only write YOUR file. Work fast (~2-3 minutes).

## Modules (file -> API)

1. `src/tiles_outdoor.js` -> `H.tilesOutdoor = { draw(ctx,id,px,py,tx,ty,env,nb), solid:{id:bool} }`
   ids: grass, tallgrass, flowers, path, cobble, water, sand, bridge.  `nb(dx,dy)` returns neighbour tile id (use for
   path/grass edge blending, water shoreline with foam, sand edges). Grass: lush multi-tone, varied per tile (hash tx,ty),
   blades swaying with env.wind and t. Water animated (ripples, sparkle highlights). solid: water.
2. `src/tiles_indoor.js` -> `H.tilesIndoor = { draw(ctx,id,px,py,tx,ty,env,nb), solid:{} }`
   ids: floor_wood, floor_tile, rug, wall, void. `wall` = wallpapered wall face (cozy, warm), with crown molding when
   nb(0,-1) is void/not wall and baseboard when nb(0,1) is not wall. `void` = black. rug = woven rug with border
   (use nb to draw border edges). solid: wall, void.
3. `src/props_outdoor.js` -> `H.propsOutdoor = { info:{type:{fw,fh,solid}}, draw(ctx,type,px,py,env) }`
   (px,py) = top-left pixel of footprint (fw x fh tiles); art may extend upward beyond footprint. Types:
   tree (fw1 fh1, art ~3x3 tiles, canopy sways), pine (1x1), bush (1x1), fence_h (1x1), fence_v (1x1), lamp (1x1, info.light),
   mailbox, rock, sign, well (2x2), flowerbed (2x1), bench (2x1), barrel, crate.
   info may include `light:{dx,dy,r,color}` (px offset from footprint top-left) for night lights (lamp).
4. `src/buildings.js` -> `H.buildings = { info:{type:{fw,fh,lights:[{dx,dy,r,color}]}}, draw(ctx,type,px,py,env) }`
   Footprints FIXED: house_player 6x4, house_a 5x4, tavern 8x5 (sign with a ramen bowl), shop 6x4 (potion/backpack sign),
   school 10x6 (magic school, tower, crest). Roof art extends above footprint (~3 tiles). Door is ALWAYS at footprint tile
   (floor(fw/2), fh-1). house_player has a stone chimney with smoke. Windows glow warm when env.time is night (>=19 or <6).
   lights[] = window glow positions.
5. `src/furniture.js` -> `H.furniture = { info:{type:{fw,fh,solid,decor,light}}, draw(ctx,type,px,py,env) }` and
   `H.items = { list:[{id,name,desc}], draw(ctx,id,x,y) }` (16x16 icons: backpack, lantern, teddy, cookbook, compass,
   scarf, slingshot, bread, map, candle, kite, mirror).
   Furniture types & footprints: fireplace 2x1 (stone, animated fire, art extends up 2 tiles over the wall, light),
   bed 1x2, table 2x2, chair 1x1, bookshelf 2x1 (extends up 1 tile), stove 1x1, cupboard 2x1, plant 1x1, clock 1x1,
   chest 1x1, sofa 2x1, window 1x1 (decor:true, drawn on wall tile, shows night sky/moon or day sky by env.time),
   picture 1x1 (decor), floor_lamp 1x1 (light).
6. `src/characters.js` -> `H.chars = { draw(ctx,key,x,y,dir,frame,env), portrait(key) -> canvas 96x96 }`
   (x,y) = feet center. Sprite ~16x24, 4 directions, walk frames 0..3 (0/2 = stand). Keys: kid (curious ~10yo, messy
   hair, scarf), mom, dad, elder, innkeeper, shopkeeper, girl, boy. Portraits: large expressive, detailed shading.
7. `src/spirits.js` -> `H.spirits = { list:[{key,name,element}], draw(ctx,key,x,y,env,opts), portrait(key) -> canvas 96x96 }`
   (x,y) = center. Cute funny animal-like elemental spirits, ~24x24, idle bob/animation, element aura particles in sprite.
   keys: hontori (fire fox spirit from the chimney — the hero spirit, ember tail, soot smudge), plus one per element:
   water (otter), wind (owl/swift), grass (hedgehog/fawn), electric (ferret/mouse), earth (armadillo/mole),
   dark (cat/bat), light (moth/lamb). Give each a fun name.
8. `src/fx.js` -> `H.fx = { shadow(ctx,x,y,rx,ry,env), createLighting(w,h) -> {render(ctx,camX,camY,env,lights)},
   createWeather(w,h) -> {update(dt,env), draw(ctx,camX,camY,env)}, createParticles() -> {emit(kind,x,y,n), update(dt,env), draw(ctx,camX,camY)} }`
   shadow: soft dark ellipse (pixel-ish), offset/stretched by sun direction from env.time, faint at night.
   lighting: darkness/tint overlay by env.time (warm dusk, deep blue night, golden morning), indoor night = dim warm;
   lights [{x,y,r,color,flicker}] in world px punch glowing holes + additive colour glow. Weather: rain (streaks + splashes +
   darkening), wind (leaves/petals), snow, fog (drifting layers); clouds shadows drifting over ground in daytime.
   particles kinds: sparkle, ember, smoke, magic (colourful swirl), dust. Draw particles additively.
9. `src/maps.js` -> `H.maps = { home:{...}, village:{...} }` and `H.script = { intro:[steps] }`
   map: { w,h, tileset:'indoor'|'outdoor', ground:[strings h rows of w chars], legend:{char:tileId},
   props:[{type,x,y}] (tile coords, type from furniture / props_outdoor), buildings:[{type,x,y}] (village only),
   npcs:[{key,x,y,dir,lines:[[speaker,text],...]}] (tile coords), doors:[{x,y,to,tx,ty,dir}] (stepping on tile x,y ->
   map `to` at tx,ty), spawn:{x,y,dir}, env:{time,weather} }.
   home: ~20x14, walls 2 rows at top (row0 wall top can be wall too), living room with fireplace on top wall, kitchen
   (floor_tile), kid bedroom corner, rugs, windows, mom & dad as npcs, front door on bottom edge leading to village
   house_player door. Night (time 22). village: ~60x40, varied & non-repetitive: house_player (door must match doors[]),
   3 house_a, tavern, shop, school, plaza with well, river with bridge, pond, flower meadows, tall grass, forest edges,
   fences, lamps, signs. 6+ villager npcs with personal little stories/hints. time 9, weather 'wind'.
   Door tile of a building at map (x,y) is (x+floor(fw/2), y+fh-1); put doors[] entry there, arriving at tile below it.
   intro steps: {say:[speakerKey,name,text]} | {do:'spiritAppear'|'shake'|'giveWand'|'spell'|'fade'}.
   Story: night, kid can't sleep, rumble in the fireplace, coughing, Hontori pops out of the chimney speaking barely in
   rhyme ("the world has magic, truth be told..."), people without magic sight = "the Unveiled-not"/ invent a word (NOT "muggles"),
   kid: "my parents will freak!", Hontori coughs up a wand, teaches spell to lift the veil ("Velum Aperi"), invites adventure.
10. `src/ui.js` -> `H.ui = { init(rootEl), say(speakerName, text, portraitCanvas, color) -> Promise, choose(options) -> Promise<int>,
    advance(), isOpen(), hud(env, placeName), toast(text), fade(ms) -> Promise, input:{dx,dy,action} }`
    DOM/CSS overlay above the canvas (NOT canvas text) so text is SUPER clear: modern readable font (Google font
    'Nunito' or 'M PLUS Rounded 1c' via <link> injected by init, fallback system-ui), large size, high contrast, rounded
    panel with subtle border glow, name plate, portrait on left, typewriter with skip, blinking ▼ indicator. HUD top-left:
    place name + clock + weather icon. Touch controls for mobile (virtual d-pad + A button) feeding H.ui.input;
    keyboard handled by engine. Responsive for phone. Inject its own <style>.

Engine (`src/engine.js`) + `index.html` are written by the lead — do not create them.
