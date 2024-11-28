const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const collection = require("./models/config");
const Tarea = require("./models/configtareas");
const bcrypt = require('bcrypt');
const formatMessage = require("./utils/messages");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const {
  userJoin,
  getCurrentUser,
  userLeaves,
  getRoomUsers,
} = require("./utils/users");

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    console.log('Bienvenido a la sala');

    socket.broadcast
      .to(user.room)
      .emit(
        console.log('Se ha unido a la sala'));

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  socket.on("disconnect", () => { 
    const user = userLeaves(socket.id); 
    if (user) { io.to(user.room).emit
      (console.log('Ha dejado la sala')); 
        io.to(user.room).emit("roomUsers", 
          { room: user.room, users: getRoomUsers(user.room), }); } });

});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {

  const data = {
      name: req.body.username,
      password: req.body.password
  }

    const existingUser = await collection.findOne({ name: data.name });

  if (existingUser) {
      res.send('Usuario ya existe, elija otro nombre de usuario');
  } else {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);
      data.password = hashedPassword;
      const userdata = await collection.insertMany(data);
      console.log(userdata);
      res.render("index");
  }

});

// Login user 
app.post("/login", async (req, res) => {
  try {
      const check = await collection.findOne({ name: req.body.username });
      if (!check) {
          res.send("Nombre de usuario no encontrado")
      }
      // Compare the hashed password from the database with the plaintext password
      const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
      if (!isPasswordMatch) {
          res.send("Contraseña incorrecta");
      }
      else {
          res.render("home");
      }
  }
  catch {
      res.send("Detalles incorrectos");
  }
});


/* API REST */
app.post('/tareas', async(req, res) =>{
    const tarea = new Tarea(req.body);
    await tarea.save();
    io.emit("nuevaTarea", tarea);
    res.status(201).send(tarea);
});

app.get('/tareas', async(req, res) =>{
    const tareas = await Tarea.find();
    res.send(tareas);
});

app.put('/tareas/:id', async (req, res) => {
    try {
        const tarea = await Tarea.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tarea) {
            return res.status(404).send('Tarea no encontrada');
        }
        io.emit('actualizarTarea', tarea);
        res.send(tarea);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.delete('/tareas/:id', async (req, res) => {
    try {
        const tarea = await Tarea.findByIdAndDelete(req.params.id);
        if (!tarea) {
            return res.status(404).send('Tarea no encontrada');
        }
        io.emit('eliminarTarea', req.params.id);
        res.send(tarea);
    } catch (error) {
        res.status(400).send(error);
    }
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Listening port ${port}..`));

