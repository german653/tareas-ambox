import "./App.css";
import { Parrafo, PerfilUsuario, Titulo } from "./components";
import usuarios from "./data/usuarios";

function App() {
  return (
    <>
      <Titulo texto="Hola Mundo" />
      <Parrafo texto="Estoy programando en React, pero ta dificil" />
      <section className="contenedorUsuarios">
        {usuarios.map((usuario) => {
          return (
            <PerfilUsuario
              nombre={usuario.nombre}
              edad={usuario.edad}
              trabajo={usuario.trabajo}
            />
          );
        })}
      </section>
    </>
  );
}

export default App;
