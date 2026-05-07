import Subtitulo from "../subtitulo/subtitulo";
import Titulo from "../titulo/titulo";
import "./perfilUsuario.css";

export default function PerfilUsuario({ nombre, edad, trabajo }) {
  return (
    <article>
      <Titulo texto={nombre} />
      <Subtitulo titulo="Edad" valor={edad} />
      <Subtitulo titulo="Trabajo" valor={trabajo} />
    </article>
  );
}
