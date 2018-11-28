const axios = require("axios");
const api = "http://ec2-34-216-8-43.us-west-2.compute.amazonaws.com";

let maze = [];
let token;

const getToken = async () => {
  try {
    return await axios.post(`${api}/session`, {
      uid: "504993197"
    });
  } catch (error) {
    console.error(error);
  }
};

const getMaze = async () => {
  try {
    return await axios.get(`${api}/game`, {
      params: {
        token: token
      }
    });
  } catch (error) {
    console.error(error);
  }
};

const postMove = async direction => {
  let {
    data: { result }
  } = await axios.post(`${api}/game?token=${token}`, {
    action: `${direction}`
  });
  return result;
};

const solveMaze = async (size, start) => {
  const x = size[0];
  const y = size[1];
  let startX = start[0];
  let startY = start[1];
  const DIRECTIONS = ["RIGHT", "UP", "LEFT", "DOWN"];
  maze = [];
  for (let i = 0; i < x; i++) {
    maze[i] = [];
    for (j = 0; j < y; j++) {
      maze[i][j] = 0;
    }
  }
  let solved = false;
  let moveStack = [];
  while (!solved) {
    maze[startX][startY] = 1;
    let result;
    if (startX < x - 1 && !maze[startX + 1][startY]) {
      result = await postMove("RIGHT", token);
      startX++;
      moveStack.push("r");
    } else if (startY > 0 && !maze[startX][startY - 1]) {
      result = await postMove("UP", token);
      startY--;
      moveStack.push("u");
    } else if (startX > 0 && !maze[startX - 1][startY]) {
      result = await postMove("LEFT", token);
      startX--;
      moveStack.push("l");
    } else if (startY < y - 1 && !maze[startX][startY + 1]) {
      result = await postMove("DOWN", token);
      startY++;
      moveStack.push("d");
    } else {
      let last = moveStack.pop();
      switch (last) {
        case "u":
          result = await postMove("DOWN", token);
          startY++;
          break;
        case "d":
          result = await postMove("UP", token);
          startY--;
          break;
        case "r":
          result = await postMove("LEFT", token);
          startX--;
          break;
        case "l":
          result = await postMove("RIGHT", token);
          startX++;
          break;
      }
    }
    if (result == "END") {
      solved = true;
    } else if (result == "SUCCESS") {
      continue;
    } else if (result == "OUT_OF_BOUNDS") {
      console.log("this shoudl not happen");
    } else if (result == "WALL") {
      let last = moveStack.pop();
      maze[startX][startY] = 2;
      switch (last) {
        case "u":
          startY++;
          break;
        case "d":
          startY--;
          break;
        case "l":
          startX++;
          break;
        case "r":
          startX--;
          break;
      }
    }
  }
};

const solve = async () => {
  const tokenData = await getToken();
  token = tokenData.data.token;
  // after getting the token
  if (token) {
    // data contains the maze info
    let {
      data: {
        maze_size,
        current_location,
        status,
        levels_completed,
        total_levels
      }
    } = await getMaze(token);
    while (status !== "FINISHED" && levels_completed < total_levels) {
      console.log(status);
      console.log("Current level: " + levels_completed);
      console.log("Maze size: " + maze_size);
      console.log("Start location: " + current_location);
      await solveMaze(maze_size, current_location, token);
      ({
        data: {
          maze_size,
          current_location,
          status,
          levels_completed,
          total_levels
        }
      } = await getMaze(token));
    }
    console.log(status);
  }
};

solve();
