import {useEffect, useRef} from "react";
import controller_sala_virtual from "./controller_sala_virtual";

const Jogador = ({id, data, isCurrentPlayer, balaoFala, roomRef, onMove, inputFocado, teclasPresionadas}) => {
    const {nome, cor, posicao} = data;
    const jogadorRef = useRef(null);
    const posicaoAtualRef = useRef(posicao);

    // Aplicar posição diretamente via CSS sem causar re-renderização
    useEffect(() => {
        posicaoAtualRef.current = posicao;
        if (jogadorRef.current) {
            jogadorRef.current.style.transform = `translate(${posicao.x}px, ${posicao.y}px)`;
        }
    }, [posicao.x, posicao.y]);

    // Gerenciar o movimento com teclas
    useEffect(() => {
        if (!isCurrentPlayer) return;

        const tratarTeclaPressionada = (e) => {
            if (inputFocado) return;

            switch (e.key) {
                case "ArrowUp":
                    teclasPresionadas.current.cima = true;
                    e.preventDefault();
                    break;
                case "ArrowDown":
                    teclasPresionadas.current.baixo = true;
                    e.preventDefault();
                    break;
                case "ArrowLeft":
                    teclasPresionadas.current.esquerda = true;
                    e.preventDefault();
                    break;
                case "ArrowRight":
                    teclasPresionadas.current.direita = true;
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        };

        const tratarTeclaSolta = (e) => {
            switch (e.key) {
                case "ArrowUp":
                    teclasPresionadas.current.cima = false;
                    break;
                case "ArrowDown":
                    teclasPresionadas.current.baixo = false;
                    break;
                case "ArrowLeft":
                    teclasPresionadas.current.esquerda = false;
                    break;
                case "ArrowRight":
                    teclasPresionadas.current.direita = false;
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("keydown", tratarTeclaPressionada);
        window.addEventListener("keyup", tratarTeclaSolta);

        return () => {
            window.removeEventListener("keydown", tratarTeclaPressionada);
            window.removeEventListener("keyup", tratarTeclaSolta);
        };
    }, [isCurrentPlayer, inputFocado]);

    return (
        <div
            ref={jogadorRef}
            className="jogador"
            // Definir posição inicial como 0,0 - a transformação vai fazer o posicionamento
            style={{
                left: 0,
                top: 0,
                transform: `translate(${posicao.x}px, ${posicao.y}px)`,
            }}
        >
            {balaoFala && <div className="balao-fala">{balaoFala.texto}</div>}
            <div className={`avatar ${isCurrentPlayer ? "avatar-atual" : ""}`} style={{backgroundColor: cor}}>
                {nome.charAt(0).toUpperCase()}
            </div>
            <span className="nome-jogador">{nome}</span>
        </div>
    );
};

export const ListaJogadores = ({roomRef, teclasPresionadas, atualizarPosicaoJogador}) => {
    const useJogadores = controller_sala_virtual.contexto.jsx.get_jogadores();
    const useJogadorAtual = controller_sala_virtual.contexto.jsx.get_jogador_atual();
    const useBaloesFala = controller_sala_virtual.contexto.jsx.get_baloes_fala();
    const useInputFocado = controller_sala_virtual.contexto.jsx.get_input_focado();

    return (
        <>
            {Object.keys(useJogadores).map((id) => (
                <Jogador
                    key={id}
                    id={id}
                    data={useJogadores[id]}
                    isCurrentPlayer={useJogadorAtual && id === useJogadorAtual.id}
                    balaoFala={useBaloesFala[id]}
                    roomRef={roomRef}
                    onMove={atualizarPosicaoJogador}
                    inputFocado={useInputFocado}
                    teclasPresionadas={teclasPresionadas}
                />
            ))}
        </>
    );
};

export default Jogador;
