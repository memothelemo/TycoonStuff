# Contributing

Thanks for contributing to my game project!

## Getting Started
First, we'll need to setup the development build of the game

**These are programs you'll need to install:**
- [Git](https://git-scm.com)
- [Node.js](https://nodejs.org)
- [Foreman](https://github.com/Roblox/foreman/releases)

**Required Foreman packages:**
- Rojo (To sync with ROBLOX Studio and the file system)
- run-in-roblox (Required for Unit Testing)

**Required Node packages:**
- NPM
- roblox-ts (transpiler)

We will also assume you know the basic knowledge of using the terminal (Whether if it is `cmd` or `bash`)

**Warning:**
_You're required to have a basic knowledge of TypeScript and Rojo before editing the entire `src` folder. It is not definitely recommened to edit directly in ROBLOX Studio, otherwise you'll see a ton of mess made by the compiler._

_However if you're not planning on editing it, you can ignore this warning_

1. **OPTIONAL**: Fork the repository by clicking the `Fork` button (make sure you scrolled way up to the page to see it)

2. Decide where you want to save the repository.

3. Open your favorite terminal

3. You can run these following commands. Copy the entire line, one by one. (Ignore lines starting with an hashtag. These are not important)

```bash
# If you fork the repository, replace memothelemo with your Github username
git clone https://github.com/memothelemo/TycoonStuff.git

# Navigate to TycoonStuff folder
cd TycoonStuff

# Install required packages
npm install

# Compile and build the game
npm run build-game
```

4. If it compiles successfully, you can now open `game.rbxlx` file right into your File Explorer window.

5. If you want to get the latest changes to the game. Run these commands below (same action as Step 3):

```bash
# Pull latest changes
git pull

# Compile and build the game again
npm run build-game
```

6. Game documentation is not written yet. Read my code fully for greater understanding of what my game actually does.

## Unit Testing
This game repository provides automated unit tests for util modules (inside `src/Shared/Specs`)

You can run the testing process if you have Roblox Studio and Foreman installed. (Only works on Windows and MacOS):

1. Run this line below here:
```bash
npm test
```
