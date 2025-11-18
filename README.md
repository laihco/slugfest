# SlugFest

## Devlog Entry

11/13/25

Ananya

- ReadMe created. Assigned team lead roles.

11/14/25

Matthew

- Set up Deno + Three.js project. Added basic 3D scene with cube and OrbitControls. Configured deno.json tasks for development and build. Verified project runs via `deno task dev`.
- Added support for importing Blender models (.glb) using GLTFLoader so 3D assets can be displayed in the scene.

11/18/25

Matthew

- Implemented a player system with gravity, floor collision, and keyboard movement (WASD).

- Set up a locked, diagonal over-the-shoulder camera that follows the player smoothly.

- Replaced the flat sky color with a shader-based gradient for a warm late-afternoon sky.

- Configured floor as a box mesh with editable height to properly collide with the player model.

- Loaded Blender player model (.glb) into scene

## Introducing the team

Either organizing by person or by role, tell us who will do what on your team. Your team should span at least the following four roles:

Tools Lead: Ananya Setty

Engine Lead: Matt Kin

Design Lead: Melissa Rosales

Testing Lead: Melissa Rosales

## Tools and materials

Engine: We will be using three.js because it supports 3D rendering and physics and we can utilize our knowledge of typescript.

Language: Our team is planning to use TypeScript or [Three.js Documentation](https://threejs.org/docs/) for our game. We choose typescript because we believe we should put into practice what we have learned this quarter.

Tools: We are planning to use VSCode as our IDE and Blender for our 3D models. One of our teammates has a little bit of experience with Blender so it makes the most sense.

Generative AI: We plan on using bayleaf AI because the formatting of the AI focuses on assisting rather than giving out answers. It is important to think first before just asking for the solution, also the step by step assistance of bayleaf is super helpful in breaking down steps and setting you up for success.

## Outlook

Our team is hoping to add minigames that use 3d models/physics. These minigames will be different from other teams as we will be focusing on a more carnival thematic with a prize system.

As our team is centered around 2D art we will need to learn how to create 3D assets for our game.

We want to become more comfortable using engines and tools we don’t usually use (Unity/Unreal).
