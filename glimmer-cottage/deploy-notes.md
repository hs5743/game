# Web deployment notes

The browser build is produced by the repository workflow. It uses Godot's Web/Compatibility export and a single thread, so GitHub Pages does not need SharedArrayBuffer cross-origin headers. The game uses WebAssembly and WebGL 2.0; desktop Chromium/Firefox are the recommended browsers.

The first click on the game is required before word audio can play because browsers block unsolicited audio. Progress is stored in each player's browser `user://` storage. Private/incognito mode or clearing site data can remove it.

The repository includes a small OFL-licensed Noto Sans Traditional Chinese subset containing the game's UI characters. It is preloaded by the game and exported with the Web build, so Chinese UI text renders consistently without depending on fonts installed on the player's computer.

