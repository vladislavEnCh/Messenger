const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
// ========================
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const conversationRoute = require("./routes/conversations");
const messageRoute = require("./routes/messages");
const groupRoute = require("./routes/group");
const Group = require("./models/Group")
const Message = require("./models/Message");
// ===========================
const router = express.Router();
const path = require("path");
const keys = require('./config/keys.dev')
const bodyParser     = require('body-parser');
dotenv.config();

mongoose.connect(
  keys.mongoURI,
  { useNewUrlParser: true, useUnifiedTopology: true , useFindAndModify: false },
  () => {
    console.log("Connected to MongoDB");
  }
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(require('cors')())
app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json("File uploded successfully");
  } catch (error) {
    console.error(error);
  }
});

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/group", groupRoute);

const server =  app.listen(5000, () => {
  console.log("Backend server is running!");
});
// ======================================Socket
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:4200",
  },
});

let users = [];

// let group = ['general','tech'];

getAllGroup = async (id) =>{
    const group = await Group.find({members:id})
    return group
}
getMessageGroup = async (groupId) =>{
  const messages = await Message.find({conversationId:groupId})
  return messages
}
const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

addGroup = (groupId, socketId) => {
  !group.some((group) => group.groupId === userId) &&
  users.push({ userId, socketId });
}

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};
const getGroup = async (id) => {
  const group = await Group.findOne({_id:id})
  return group;
};

io.on("connection", (socket) => {
  //when ceonnect
  socket.on("setup", (userData) => {
    socket.join(userData?._id);
    socket.emit("connected");
  });
  console.log("a user connected");

  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

//  .sort({ date: -1 })
//         .limit(50)
//         .sort({ date: 1 })
//         .lean()

  // ==================Group===============
  socket.on("getGroup", async (id) => {
    const group = await getAllGroup(id);
    io.emit("getGroup", {
      group
    });
  });
socket.on("joinRoom", async(group)=>{
  socket.join(group)
  console.log("User Joined Room: " + group);
 const roomMessage = await getMessageGroup(group)
  socket.emit('roomMessage',roomMessage)
})
  socket.on('sendMessageRoom', async ({ senderId, receiverId, text }) => {
    const group = await  getGroup(receiverId)
    console.log(senderId, text)
    io.emit("getMessageRoom",{
      senderId,
      text,
    })
    socket.broadcast.to(group).emit('getMessageRoom', text);
  })

  //send and get message
  socket.on("sendMessage", ({text, receiverId, senderId, conversationId}) => {
    const user = getUser(receiverId);
    io.to(user?._id).emit("getMessage", {
      senderId,
      text,
      conversationId
    });
  });
  socket.on("typing", (userId) => {
    
    const user = getUser(userId);
    socket.in(user?.socketId).emit("typing")
  });
  socket.on("stop typing", (userId) => {
    const user = getUser(userId);
    socket.in(user?.socketId).emit("stop typing")
  });
  socket.on('draw', (res) => {
    socket.emit('draw', res);
  
  })

  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});
