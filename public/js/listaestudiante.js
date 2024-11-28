const socket = io();
const chatMessages = document.querySelector(".chat-messages");
const chatForm = document.getElementById("chat-form");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const tareasElement = document.getElementById('tareas');
const nuevaTareaForm = document.getElementById('nuevaTarea');

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

socket.emit("joinRoom", { username, room });

socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

socket.on("message", (message) => {
  outputMessage(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = e.target.elements.msg.value;
  socket.emit("chatMessage", message);
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username}<span>  ${message.time}</span></p>
                    <p class="text">
                        ${message.text}
                    </p>`;
  document.querySelector(".chat-messages").appendChild(div);
}

function outputRoomName(room) {
  roomName.innerText = room;
}

function outputUsers(users) {
  userList.innerHTML = `${users
    .map((user) => `<li>${user.username}</li>`)
    .join("")}`;
}



socket.on('nuevaTarea', (tarea) => {
  agregarTarea(tarea); // Escucha el evento 'nuevaTarea' y llama a la función para agregarla a la interfaz de usuario
});

socket.on('actualizarTarea', (tarea) => {
  actualizarTareaEnUI(tarea); // Escucha el evento 'actualizarTarea' y actualiza la tarea en la interfaz
});

socket.on('eliminarTarea', (id) => {
  eliminarTareaDeUI(id); // Escucha el evento 'eliminarTarea' y elimina la tarea de la interfaz
});

nuevaTareaForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Previene la recarga de la página cuando se envía el formulario
  const titulo = document.getElementById('titulo').value; // Obtiene el valor del campo de entrada
  fetch('/tareas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ titulo, completado: false}), // Envía los datos de la nueva tarea al servidor
  }).then(() => {
    document.getElementById('titulo').value = ''; // Limpia el campo de entrada tras enviar la tarea
  });
});

// Cargar las tareas actuales
fetch('/tareas')
  .then((res) => res.json()) // Convierte la respuesta en JSON
  .then((tareas) => {
    tareas.forEach(agregarTarea); // Para cada tarea obtenida, la agrega a la interfaz
  });

// Función para agregar una tarea a la interfaz
function agregarTarea(tarea) {
  const li = document.createElement('li'); // Crea un nuevo elemento de lista para la tarea
  li.textContent = tarea.titulo; // Asigna el título de la tarea
  li.dataset.id = tarea._id; // Establece el ID de la tarea en un atributo de datos

  const container = document.createElement('div'); // Crea un contenedor para la tarea
  container.classList.add('tarea-container'); // Añade una clase al contenedor

  const botonCompletado = document.createElement('button'); // Crea el botón para marcar la tarea como completada
  botonCompletado.textContent = tarea.completado ? 'Calificada' : 'No revisada'; // Define el texto del botón según el estado de la tarea
  botonCompletado.disabled = true;
  botonCompletado.classList.add('btn', 'btn-completado'); // Añade clases al botón
  botonCompletado.addEventListener('click', () => {
    fetch(`/tareas/${tarea._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ completado: !tarea.completado }), // Envía la solicitud al servidor para cambiar el estado de la tarea
    })
    .then(response => response.json()) // Convierte la respuesta en JSON
    .then(updatedTarea => {
      botonCompletado.textContent = updatedTarea.completado ? 'Calificada' : 'No revisada'; // Actualiza el texto del botón tras el cambio de estado
    })
    .catch(error => console.error('Error al actualizar la tarea:', error)); // Maneja errores
  });

  

  const botonEliminar = document.createElement('button'); // Crea el botón para eliminar la tarea
  botonEliminar.textContent = 'Eliminar'; // Define el texto del botón
  botonEliminar.disabled = true;
  botonEliminar.classList.add('btn', 'btn-eliminar'); // Añade clases al botón
  botonEliminar.addEventListener('click', () => {
    fetch(`/tareas/${tarea._id}`, {
      method: 'DELETE', // Envía la solicitud para eliminar la tarea
    }).then(() => {
      eliminarTareaDeUI(tarea._id); // Elimina la tarea de la interfaz tras la eliminación en el servidor
    });
  });

 

  container.appendChild(li); // Añade la tarea (li) al contenedor
  container.appendChild(botonCompletado); // Añade el botón de completado al contenedor
  container.appendChild(botonEliminar);
  tareasElement.appendChild(container); // Añade el contenedor de la tarea a la lista de tareas
}



// Función para actualizar la tarea en la interfaz
function actualizarTareaEnUI(tarea) {
  const li = document.querySelector(`li[data-id="${tarea._id}"]`); // Busca el elemento de lista con el ID de la tarea
  if (li) {
    li.textContent = tarea.titulo; // Actualiza el texto del título de la tarea
  }
}

// Función para eliminar la tarea de la interfaz
function eliminarTareaDeUI(id) {
  const li = document.querySelector(`li[data-id="${id}"]`); // Busca la tarea con el ID proporcionado
  if (li) {
    li.parentElement.remove(); // Elimina el elemento de la interfaz
  }
}


