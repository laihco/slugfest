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

11/19/25

Melissa

- Set up a square cube as a box mesh with editable size, and height

- Box can collide with the player like a pressure plate to call scene transition

Matthew

- Created models for bottles and player in Blender

- Created main hub

- Ball Toss Functional with UI

- Bottle Toss game completed with working physics

- Added Ability to change scenes properly

Ananya

- Modeled a 3D Water Gun Stand in Blender to be used for one of the carnival minigames. This includes the base stand, water tank housing, and initial placeholder targets. Exported the asset as .glb and prepped it for integration into Three.js.

- Worked on a separate feature branch focused on minigame structure and scene logic. Progress isn’t yet merged into main, but includes:

  - Targetry and researching water physics

  - Created and adjusting custom materials for the Water Gun Stand, including shading, glossy plastic surfaces, and water tank transparency. Experimented with Blender's material nodes to get a readable look that still works well once exported to Three.js.

11/20/2025

Melissa

- 3D modeled a carnival tent for the main hub and the Milk Toss game

- Implimented the 3D model

- Added collision with tent so player cannot phase through it

- F1 Requirnments

11/21/2025

Ananya

- Implemented full win and lose conditions for the Milk Toss game, including game start/stop flow and bottle-down checks.

- Added scene transitions back to the MainHub after the player wins or runs out of balls.

- Fixed the issue where the Milk Toss UI was visible in the MainHub

- Set up full game resets on every new entry into the tent, restoring ball count, bottle states, and clearing any remaining objects from previous attempts.

- Debugged scene transition issues and cleaned up leftover state between plays.

- Worked through commit issues, deployment errors, and general cleanup for the build.

- F1 video submission

11/29/2025

Matthew Kin

- Created inventory.ts and UI

11/30/2025

Melissa

- Added a new tent model for the Duck Pond game

- Created a square that will teleport you to the game when you stand on it

- Created a Style.css for style code and added some of the win/lose condition style text

- Added a win and lose condition for the Duck Pond game

12/1/2025

Matthew Kin

- Added inventory updating

- Added locked requirements to booths

12/4/2025

Melissa Rosales

- Bug fixed git hub pages so that it loads and works correctly

- Increased the hit box size of the ducks for the duck game

## F1 Requirements

1. The platform we decided to use is TypeScript which does not already provide support for 3D rendering and physics simulation. TypeScript is our primary langauyge and framework for this project with calls to THREE.js for all of our 3D rendering.

2. Our Third party 3D rendering party is THREE.js. THREE.js is a open-source JavaScript library which helps us create and display our 3D graphics. Adding features such as
   scene graph, geometrics, materials and shaders, lighting, textures, loaders and much more. We use THREE.js to load in all of our 3D models place them in the world and render them.

3. Our third party physics simulation is not used via a library but all coded by Matt Kin. The physics we use as of right now is the player load in, in which the player will fall from the sky, as well as the ball throwing in our frist game Milk Toss. The ball is charged up using left clicked and then thrown as far as you have held the click. So in short, the longer you hold left click the stronger the force the ball with be tossed.

4. The playable prototype of our game includes the first mini game of the carnival Slug Fest, that being the Milk Toss. The player is placed in front of a tower of milk bottles of which they must knock them all down in order to win. If the player fails to knock down all the pins within the number of balls then they lose.

5. The players control over the simulation is within there aim, and strength of the ball throw, if the player doesnt aim correctly then they will fail to knock all the bottles down. Moreover, if they do not hold down left click for long, the balls strength and distance will not travel enough to hit the bottles. However, if they take care of there aim and there control over how fair and the strength of the ball throw, they can succedd at the puzzle.

6. If the player knocks down all the bottles then the game will send you to a you win scene. If the player runs out of balls then it will take the player to a you lose screen. Both of which will take you back to the main hub to try again.

7. Our codebase containes berfore-commit automation via linting and auto formatting. Within our deno.json for linting we have lint config and lint task. For auto formatting our deno.json contains formatting settings and tasks. We also have some typechecking and build checks within our deno.json, as it defines check and ci tasks.

8. As some post-push automation that helps developers our project contains automatic packaging and deployment to GitHub pages however, it is currently experiencing some technical difficulties. There is a current problem with our code packages we are still trying to fix as THREE.js is struggling with being in TypeScript. On the other end we also have the automatic download of deno so anyone who opens the code with automatically be able to use deno commands within codespaces.

## F1 Reflection

Melissa

- As we started this project a lot of us branched out from our roles and all helped each other and each task like we are all every roll. We all did 3D modeling brainstromed game ideas together and came up with a plan. We also all committed to making dev logs full and accurate which has really helped all of us comprehend what is happening and what has been done.

Matthew Kin

- During the production of this project, we often helped each other across different roles, collaborating on tasks outside our primary responsibilities. One of the biggest learning points for me was figuring out how to translate traditional game mechanics into Three.js. Because Three.js doesn’t provide built-in physics, I had to code behaviors manually, including force application, projectile motion, and object interactions. This process gave me a greater appreciation for how engines like Unity handle these systems behind the scenes and pushed me to think carefully about optimization and player control in a 3D space.

Ananya Setty

- During this first week, we all ended up taking on a lot of different responsibilities, especially as we built out more of the game systems and added new features. I spent my time fixing scene transitions, solving UI issues, organizing our tools, and making sure the game reset correctly every time the player entered a minigame. I also worked in Blender creating the Water Gun Stand and experimented with shaders and materials so it would look good once imported into Three.js. I also dealt with some commit cleanup and deployment issues that came up as we pushed updates, which hopefully will help keep the project more stable and reliable in teh future.

## F2 Requirements

1. The game continues to use the same physics system established in F1.

2. The player can access two separate minigames—Milktoss and Duck Pond—by walking onto designated trigger boxes.

3. In Duck Pond, the player can click on ducks to select them. In Milktoss, the player can hold to charge and throw balls.

4. The inventory system can store stuffed animals across all scenes.

5. Players can earn stuffed animals by winning the carnival minigames.

6. Players can lose Milktoss by running out of balls, and they can lose Duck Pond by selecting the wrong duck.

7. The player wins the overall game after collecting both unique plush prizes.

## F2 Reflection

Matthew Kin

- Looking back on how we met the F2 requirements, our team’s plan has changed noticeably since our F1 devlog. One of the biggest realizations was how much more planning the inventory system needed than we originally expected. In F1, we assumed inventory would be a simple add-on, but once we started integrating multiple minigames and scene transitions, it became clear that the inventory had to persist across scenes, sync properly with game logic, and update immediately when the player won prizes. Setting this up required rethinking how our data was stored, how scenes communicated with each other, and how to keep everything consistent without breaking existing features.

Ananya Setty
- For F2, most of my work centered around building out the Water Gun qand Duck Pond minigames and planning ahead in case the water mechanics didn’t reach a stable state in time. Early on, I spent a lot of time experimenting with approaches for the water system—testing different particle methods, raycasting ideas, and ways of creating gameplay targets that felt readable and satisfying. Because Three.js doesn’t come with physics or fluid simulation, a lot of this required trial and error. Building Duck Pond meant setting up a simpler interaction system based on selecting ducks. Overall, this week helped me think more strategically about scope and fallback plans.

Melissa Rosales (Orignally did this before the due date, but it got erased somehow)

- For F2 we all continued to collaborate and contribute to the project. We realized that we wanted to have a backup level in case we had trouble with the other one. I spent my time creating a win lose condition and found i would be using repeated logic from another level. I then decided it would be best to create a style file in order to store this repeated logic, to make the code less messy and to reduce smells. Moreover I realized that using older code is okay and important, its there for a reason we made it, if it can be reused again use it, and make the changes as needed. 

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
